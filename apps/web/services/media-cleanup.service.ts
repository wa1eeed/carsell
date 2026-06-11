/**
 * Media Cleanup Service
 *
 * When a car is sold or removed from a showroom:
 *   1. Set car.mediaScheduledDeleteAt = now + platform.media_delete_after_days
 *   2. Cron job runs daily → finds cars past their scheduled date
 *   3. Deletes all files in showrooms/{showroomId}/cars/{carId}/media/
 *   4. Sets car.mediaDeletedAt = now
 *
 * docs/ folder is NEVER deleted — it contains legal/financial documents.
 */

import { prisma } from '@/lib/prisma'
import { getStorage } from '@/lib/storage'
import { buildCarMediaPrefix } from '@/lib/storage/utils'
import { getPlatformSetting } from '@/repositories/plan.repository'
import logger from '@/lib/logger'

// Default days before media is deleted after sale/removal
const DEFAULT_DELETE_AFTER_DAYS = 30

// ── Schedule deletion ──────────────────────────────────────────────────────

/**
 * Called when a car's status changes to SOLD or when it's soft-deleted.
 * Schedules the media folder for deletion after N days.
 */
export async function scheduleMediaDeletion(carId: string, showroomId: string): Promise<void> {
  // Read admin-configured delay
  const setting = await getPlatformSetting('media_delete_after_days')
  const days    = setting ? Number(setting) : DEFAULT_DELETE_AFTER_DAYS

  const scheduledAt = new Date()
  scheduledAt.setDate(scheduledAt.getDate() + days)

  await prisma.car.updateMany({
    where: { id: carId, showroomId, mediaDeletedAt: null },
    data:  { mediaScheduledDeleteAt: scheduledAt },
  })

  logger.info(
    { carId, showroomId, scheduledAt, days },
    'media.cleanup: deletion scheduled',
  )
}

// ── Cancel deletion ────────────────────────────────────────────────────────

/**
 * Cancel a scheduled deletion — used when a car is re-listed (status changes back).
 */
export async function cancelMediaDeletion(carId: string, showroomId: string): Promise<void> {
  await prisma.car.updateMany({
    where: { id: carId, showroomId, mediaDeletedAt: null },
    data:  { mediaScheduledDeleteAt: null },
  })
  logger.info({ carId, showroomId }, 'media.cleanup: deletion cancelled (car re-listed)')
}

// ── Execute cleanup ────────────────────────────────────────────────────────

/**
 * Run by the daily cron job.
 * Finds all cars past their scheduled deletion date and deletes their media folder.
 * Returns count of cars processed.
 */
export async function runMediaCleanup(): Promise<{ processed: number; errors: number }> {
  const now = new Date()
  let processed = 0
  let errors    = 0

  // Find cars due for media deletion
  const cars = await prisma.car.findMany({
    where: {
      mediaScheduledDeleteAt: { lte: now },
      mediaDeletedAt: null,
    },
    select: {
      id:         true,
      showroomId: true,
      mediaScheduledDeleteAt: true,
    },
    take: 100,  // process in batches of 100
  })

  logger.info({ count: cars.length }, 'media.cleanup: starting batch')

  const storage = getStorage()

  for (const car of cars) {
    try {
      const prefix = buildCarMediaPrefix(car.showroomId, car.id)
      await deleteAllFilesWithPrefix(storage, prefix)

      // Mark as deleted
      await prisma.car.update({
        where: { id: car.id },
        data:  { mediaDeletedAt: now },
      })

      processed++
      logger.info({ carId: car.id, prefix }, 'media.cleanup: deleted media folder')
    } catch (err) {
      errors++
      logger.error({ err, carId: car.id }, 'media.cleanup: failed to delete media')
    }
  }

  logger.info({ processed, errors }, 'media.cleanup: batch complete')
  return { processed, errors }
}

// ── List media files ───────────────────────────────────────────────────────

/**
 * Returns all R2 keys for a car's media folder.
 * Used to show the list before deletion in admin UI.
 */
export async function listCarMediaFiles(showroomId: string, carId: string): Promise<string[]> {
  const storage = getStorage()
  const prefix  = buildCarMediaPrefix(showroomId, carId)
  return listFilesWithPrefix(storage, prefix)
}

// ── Internal helpers ───────────────────────────────────────────────────────

async function listFilesWithPrefix(
  storage: ReturnType<typeof getStorage>,
  prefix: string,
): Promise<string[]> {
  // StorageProvider interface needs a listFiles method — we call it via the underlying client
  // Fallback: use the R2 S3-compatible list objects API
  try {
    if ('listObjects' in storage && typeof (storage as { listObjects?: unknown }).listObjects === 'function') {
      const list = await (storage as unknown as { listObjects: (p: string) => Promise<string[]> }).listObjects(prefix)
      return list
    }
  } catch {
    // Provider doesn't support listing — return empty (cleanup will be a no-op for this car)
    logger.warn({ prefix }, 'media.cleanup: storage provider does not support listing')
  }
  return []
}

async function deleteAllFilesWithPrefix(
  storage: ReturnType<typeof getStorage>,
  prefix: string,
): Promise<void> {
  const keys = await listFilesWithPrefix(storage, prefix)
  if (keys.length === 0) {
    logger.info({ prefix }, 'media.cleanup: no files to delete (folder empty or already deleted)')
    return
  }

  // Delete in batches of 50
  const batchSize = 50
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize)
    await Promise.all(
      batch.map((key) =>
        storage.deleteFile(key).catch((err: unknown) => {
          logger.warn({ err, key }, 'media.cleanup: failed to delete individual file')
        }),
      ),
    )
  }

  logger.info({ prefix, count: keys.length }, 'media.cleanup: deleted files')
}

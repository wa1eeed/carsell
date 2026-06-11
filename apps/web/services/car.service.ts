import type { AuthUser } from '@/lib/auth'
import { AppError } from '@/lib/errors'
import logger from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { carRepository } from '@/repositories/car.repository'
import { timelineRepository } from '@/repositories/timeline.repository'
import type { CreateCarInput, UpdateCarInput } from '@/lib/validations/car.schema'
import {
  getVehicleByVin,
  getVehicleBySequenceNumber,
  resolveVdmBrandIds,
  type VdmMappedData,
} from './vdm.service'
import { scheduleMediaDeletion } from './media-cleanup.service'

/**
 * Create a car (scoped to the user's showroom), attach images, and record the
 * CAR_CREATED timeline event.
 */
export async function createCar(user: AuthUser, input: CreateCarInput) {
  // Assign next sequential car number within this showroom (independent per tenant)
  const nextRef = await prisma.car.count({
    where: { showroomId: user.showroomId },
  }) + 1

  const car = await carRepository.create(user.showroomId, user.id, { ...input, carRefNumber: nextRef })

  if (input.images && input.images.length > 0) {
    await carRepository.addImages(
      car.id,
      user.showroomId,
      input.images.map((img, i) => ({ url: img.url, isCover: img.isCover ?? i === 0, sortOrder: i })),
    )
  }

  await timelineRepository.append({
    carId: car.id,
    userId: user.id,
    eventType: 'CAR_CREATED',
    payload: { source: input.dataSource ?? 'MANUAL' },
  })

  logger.info({ carId: car.id, showroomId: user.showroomId }, 'car.created')
  return car
}

/**
 * Update car fields, recording a FIELD_UPDATED (and STATUS_CHANGED/PRICE_CHANGED) event
 * with a diff of what changed.
 */
export async function updateCar(user: AuthUser, carId: string, input: UpdateCarInput) {
  const existing = await carRepository.findById(carId, user.showroomId)
  if (!existing) throw new AppError('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

  const updated = await carRepository.update(carId, user.showroomId, input)
  if (!updated) throw new AppError('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

  const changed: Record<string, { from: string; to: string }> = {}
  for (const key of Object.keys(input) as (keyof UpdateCarInput)[]) {
    const before = (existing as Record<string, unknown>)[key]
    const after = input[key]
    if (after !== undefined && String(before) !== String(after)) {
      changed[key] = { from: String(before ?? ''), to: String(after ?? '') }
    }
  }

  if (Object.keys(changed).length > 0) {
    const eventType =
      'status' in changed ? 'STATUS_CHANGED' : 'sellPrice' in changed ? 'PRICE_CHANGED' : 'FIELD_UPDATED'
    await timelineRepository.append({ carId, userId: user.id, eventType, payload: { changed } })
  }

  return updated
}

/**
 * Look up vehicle data from VDM (Absher) — used by the "Pull from Absher" entry mode
 * and the "Update from Absher" button. Returns mapped fields + resolved catalog IDs.
 */
export async function lookupVdm(query: { vin?: string; sequence?: string }): Promise<{
  mapped: VdmMappedData
  resolved: { brandId?: string; categoryId?: string; modelId?: string; unmatchedBrand?: string }
}> {
  let mapped: VdmMappedData | null = null
  if (query.vin) mapped = await getVehicleByVin(query.vin)
  else if (query.sequence) mapped = await getVehicleBySequenceNumber(query.sequence)
  else throw new AppError('VDM_BAD_REQUEST', 'يجب إدخال رقم الهيكل أو رقم التسلسل', 400)

  if (!mapped) throw new AppError('VDM_NOT_FOUND', 'لم يتم العثور على بيانات المركبة', 404)

  const resolved = await resolveVdmBrandIds(mapped, prisma)
  return { mapped, resolved }
}

/**
 * Apply a confirmed VDM sync to an existing car (the "Update from Absher" action).
 * Sets dataSource=VDM_VIN, vdmLastSyncAt, stores raw data, and records the timeline event.
 */
export async function applyVdmSync(
  user: AuthUser,
  carId: string,
  resolvedIds: { brandId?: string; categoryId?: string; modelId?: string },
) {
  const existing = await carRepository.findById(carId, user.showroomId)
  if (!existing) throw new AppError('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)
  if (!existing.vin) throw new AppError('CAR_NO_VIN', 'لا يوجد رقم هيكل لهذه السيارة', 400)

  const { mapped, resolved } = await lookupVdm({ vin: existing.vin })
  const brandId = resolvedIds.brandId ?? resolved.brandId
  const categoryId = resolvedIds.categoryId ?? resolved.categoryId
  const modelId = resolvedIds.modelId ?? resolved.modelId

  await prisma.car.updateMany({
    where: { id: carId, showroomId: user.showroomId, deletedAt: null },
    data: {
      ...(brandId ? { brandId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(modelId ? { modelId } : {}),
      ...(mapped.year ? { year: mapped.year } : {}),
      ...(mapped.colorExt ? { colorExt: mapped.colorExt } : {}),
      ...(mapped.engineSize ? { engineSize: mapped.engineSize } : {}),
      ...(mapped.vehicleSequenceNumber ? { vdmSequenceNumber: mapped.vehicleSequenceNumber } : {}),
      ...(mapped.registrationExpiry ? { registrationExpiry: mapped.registrationExpiry } : {}),
      dataSource: 'VDM_VIN',
      vdmLastSyncAt: new Date(),
      vdmRawData: mapped.rawResponse as object,
    },
  })

  await timelineRepository.append({
    carId,
    userId: user.id,
    eventType: 'FIELD_UPDATED',
    payload: { source: 'VDM', action: 'absher_sync' },
  })

  logger.info({ carId, showroomId: user.showroomId }, 'car.vdm_synced')
}

export async function softDeleteCar(user: AuthUser, carId: string) {
  const existing = await carRepository.findById(carId, user.showroomId)
  if (!existing) throw new AppError('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)
  await carRepository.softDelete(carId, user.showroomId)
  // Schedule media deletion — photos/videos will be cleaned up after configured days
  void scheduleMediaDeletion(carId, user.showroomId)
  logger.info({ carId, showroomId: user.showroomId }, 'car.soft_deleted')
}

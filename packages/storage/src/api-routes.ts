/**
 * API Routes — File Upload / Retrieval
 * تستخدم getStorage() — لا إشارة لـ R2 أو S3 مباشرة
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma }                    from '@/lib/prisma'
import { requireAuth }               from '@/lib/auth'
import { getStorage }                from './providers/factory'
import {
  buildCarFileKey,
  validateFileUpload,
  getExtFromContentType,
  getMaxCount,
} from './utils'

// ─── POST /api/cars/[carId]/upload-url ────────

export async function POST_uploadUrl(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  const user = await requireAuth(req)
  const { carId } = params
  const body = await req.json() as {
    contentType: string
    size: number
    category: 'image' | 'document'
    docType?: string
    isCover?: boolean
  }

  const car = await prisma.car.findFirst({
    where: { id: carId, showroomId: user.showroomId, deletedAt: null },
  })
  if (!car) return NextResponse.json({ error: 'سيارة غير موجودة' }, { status: 404 })

  const validation = validateFileUpload({
    contentType: body.contentType,
    size: body.size,
    category: body.category,
  })
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

  // التحقق من الحد الأقصى للعدد
  const model = body.category === 'image' ? prisma.carImage : prisma.carDocument
  const count = await (model as any).count({ where: { carId } })
  const maxCount = getMaxCount(body.category)
  if (count >= maxCount)
    return NextResponse.json(
      { error: `الحد الأقصى ${maxCount} ${body.category === 'image' ? 'صورة' : 'ملف'} للسيارة` },
      { status: 400 }
    )

  const ext = getExtFromContentType(body.contentType)
  const key = buildCarFileKey({
    showroomId: user.showroomId,
    carId,
    category: body.category,
    ext,
    prefix: body.isCover ? 'cover' : body.docType?.toLowerCase(),
  })

  // getStorage() يعيد المزود المُهيَّأ حسب STORAGE_PROVIDER
  const storage = getStorage()
  const slot = await storage.createUploadUrl({ key, contentType: body.contentType })

  return NextResponse.json(slot)
}

// ─── POST /api/cars/[carId]/confirm-upload ─────

export async function POST_confirmUpload(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  const user = await requireAuth(req)
  const { carId } = params
  const body = await req.json() as {
    key: string
    category: 'image' | 'document'
    fileName?: string
    fileSize?: number
    docType?: string
    isCover?: boolean
  }

  const car = await prisma.car.findFirst({
    where: { id: carId, showroomId: user.showroomId, deletedAt: null },
  })
  if (!car) return NextResponse.json({ error: 'سيارة غير موجودة' }, { status: 404 })

  if (body.category === 'image') {
    if (body.isCover) {
      await prisma.carImage.updateMany({ where: { carId }, data: { isCover: false } })
    }
    const image = await prisma.carImage.create({
      data: {
        carId,
        url: body.key,
        isCover: body.isCover ?? false,
        sortOrder: await prisma.carImage.count({ where: { carId } }),
      },
    })
    await prisma.carTimeline.create({
      data: {
        carId,
        userId: user.id,
        eventType: 'FILE_UPLOADED',
        payload: { fileName: body.key.split('/').pop(), category: 'image' },
      },
    })
    return NextResponse.json({ id: image.id, key: body.key })
  }

  const doc = await prisma.carDocument.create({
    data: {
      carId,
      docType: (body.docType ?? 'OTHER') as any,
      fileUrl: body.key,
      fileName: body.fileName ?? body.key.split('/').pop() ?? 'file',
      fileSize: body.fileSize ?? 0,
      uploadedBy: user.id,
    },
  })
  await prisma.carTimeline.create({
    data: {
      carId,
      userId: user.id,
      eventType: 'FILE_UPLOADED',
      payload: { fileName: body.fileName, docType: body.docType },
    },
  })
  return NextResponse.json({ id: doc.id, key: body.key })
}

// ─── GET /api/cars/[carId]/files ──────────────

export async function GET_files(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  const user = await requireAuth(req)
  const { carId } = params

  const car = await prisma.car.findFirst({
    where: { id: carId, showroomId: user.showroomId, deletedAt: null },
    include: {
      images:    { orderBy: { sortOrder: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!car) return NextResponse.json({ error: 'سيارة غير موجودة' }, { status: 404 })

  const storage = getStorage()
  const [imageUrls, docUrls] = await Promise.all([
    storage.getSignedUrls(car.images.map((i) => i.url), 'image_preview'),
    storage.getSignedUrls(car.documents.map((d) => d.fileUrl), 'document_view'),
  ])

  return NextResponse.json({
    images: car.images.map((img, i) => ({
      id: img.id,
      url: imageUrls[i].url,
      isCover: img.isCover,
      sortOrder: img.sortOrder,
      expiresAt: imageUrls[i].expiresAt,
    })),
    documents: car.documents.map((doc, i) => ({
      id: doc.id,
      url: docUrls[i].url,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      docType: doc.docType,
      createdAt: doc.createdAt,
      expiresAt: docUrls[i].expiresAt,
    })),
  })
}

// ─── DELETE /api/cars/[carId]/files/[fileId] ──

export async function DELETE_file(
  req: NextRequest,
  { params }: { params: { carId: string; fileId: string } }
) {
  const user = await requireAuth(req)
  const { carId, fileId } = params
  const { type } = await req.json() as { type: 'image' | 'document' }

  const car = await prisma.car.findFirst({
    where: { id: carId, showroomId: user.showroomId, deletedAt: null },
  })
  if (!car) return NextResponse.json({ error: 'سيارة غير موجودة' }, { status: 404 })

  const storage = getStorage()

  if (type === 'image') {
    const image = await prisma.carImage.findFirst({ where: { id: fileId, carId } })
    if (!image) return NextResponse.json({ error: 'صورة غير موجودة' }, { status: 404 })
    await storage.deleteFile(image.url)
    await prisma.carImage.delete({ where: { id: fileId } })
    await prisma.carTimeline.create({
      data: {
        carId, userId: user.id, eventType: 'FILE_DELETED',
        payload: { fileName: image.url.split('/').pop(), category: 'image' },
      },
    })
  } else {
    const doc = await prisma.carDocument.findFirst({ where: { id: fileId, carId } })
    if (!doc) return NextResponse.json({ error: 'مستند غير موجود' }, { status: 404 })
    await storage.deleteFile(doc.fileUrl)
    await prisma.carDocument.delete({ where: { id: fileId } })
    await prisma.carTimeline.create({
      data: {
        carId, userId: user.id, eventType: 'FILE_DELETED',
        payload: { fileName: doc.fileName, docType: doc.docType },
      },
    })
  }

  return NextResponse.json({ success: true })
}

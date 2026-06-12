/**
 * Admin — Catalog Categories CRUD
 * GET    /api/v1/admin/catalog/categories[?brandId=]
 * POST   /api/v1/admin/catalog/categories
 * PATCH  /api/v1/admin/catalog/categories
 * DELETE /api/v1/admin/catalog/categories
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BodyType } from '@prisma/client'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

const createSchema = z.object({
  brandId:  z.string().min(1),
  nameAr:   z.string().min(1),
  nameEn:   z.string().min(1),
  bodyType: z.nativeEnum(BodyType),
})

const updateSchema = z.object({
  id:       z.string().min(1),
  nameAr:   z.string().min(1).optional(),
  nameEn:   z.string().min(1).optional(),
  bodyType: z.nativeEnum(BodyType).optional(),
  isActive: z.boolean().optional(),
})

const deleteSchema = z.object({
  id: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brandId') ?? undefined

  const categories = await prisma.category.findMany({
    where: brandId ? { brandId } : undefined,
    orderBy: { nameAr: 'asc' },
    include: {
      brand: { select: { id: true, nameAr: true, nameEn: true } },
      _count: { select: { models: true } },
    },
  })

  return NextResponse.json({ success: true, data: categories })
}

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const category = await prisma.category.create({ data: parsed.data })
  return NextResponse.json({ success: true, data: category }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const { id, ...data } = parsed.data
  const category = await prisma.category.update({ where: { id }, data })
  return NextResponse.json({ success: true, data: category })
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  await prisma.category.update({ where: { id: parsed.data.id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}

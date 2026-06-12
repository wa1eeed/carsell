/**
 * Admin — Catalog Brands CRUD
 * GET    /api/v1/admin/catalog/brands
 * POST   /api/v1/admin/catalog/brands
 * PATCH  /api/v1/admin/catalog/brands
 * DELETE /api/v1/admin/catalog/brands
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

const createSchema = z.object({
  nameAr:  z.string().min(1),
  nameEn:  z.string().min(1),
  logoUrl: z.string().url().optional(),
})

const updateSchema = z.object({
  id:       z.string().min(1),
  nameAr:   z.string().min(1).optional(),
  nameEn:   z.string().min(1).optional(),
  logoUrl:  z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
})

const deleteSchema = z.object({
  id: z.string().min(1),
})

export async function GET(_req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const brands = await prisma.brand.findMany({
    orderBy: { nameAr: 'asc' },
    include: { _count: { select: { categories: true } } },
  })

  return NextResponse.json({ success: true, data: brands })
}

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const brand = await prisma.brand.create({ data: parsed.data })
  return NextResponse.json({ success: true, data: brand }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const { id, ...data } = parsed.data
  const brand = await prisma.brand.update({ where: { id }, data })
  return NextResponse.json({ success: true, data: brand })
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  await prisma.brand.update({ where: { id: parsed.data.id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}

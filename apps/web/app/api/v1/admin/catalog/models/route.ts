/**
 * Admin — Catalog Models CRUD
 * GET    /api/v1/admin/catalog/models[?categoryId=]
 * POST   /api/v1/admin/catalog/models
 * PATCH  /api/v1/admin/catalog/models
 * DELETE /api/v1/admin/catalog/models
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

const createSchema = z.object({
  categoryId: z.string().min(1),
  name:       z.string().min(1),
})

const updateSchema = z.object({
  id:       z.string().min(1),
  name:     z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

const deleteSchema = z.object({
  id: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId') ?? undefined

  const models = await prisma.model.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: { name: 'asc' },
    include: {
      category: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          brand: { select: { id: true, nameAr: true, nameEn: true } },
        },
      },
    },
  })

  return NextResponse.json({ success: true, data: models })
}

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const model = await prisma.model.create({ data: parsed.data })
  return NextResponse.json({ success: true, data: model }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const { id, ...data } = parsed.data
  const model = await prisma.model.update({ where: { id }, data })
  return NextResponse.json({ success: true, data: model })
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  await prisma.model.update({ where: { id: parsed.data.id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}

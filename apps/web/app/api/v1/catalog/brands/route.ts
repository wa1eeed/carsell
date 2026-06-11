import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { catalogRepository } from '@/repositories/catalog.repository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireAuth()
    const brandId = req.nextUrl.searchParams.get('brandId')
    const categoryId = req.nextUrl.searchParams.get('categoryId')

    if (categoryId) return ok(await catalogRepository.listModels(categoryId))
    if (brandId) return ok(await catalogRepository.listCategories(brandId))
    return ok(await catalogRepository.listBrands())
  })
}

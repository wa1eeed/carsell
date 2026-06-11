import { prisma } from '@/lib/prisma'

/**
 * Catalog (brands/categories/models) — admin-managed, not tenant-scoped.
 */
export const catalogRepository = {
  async listBrands() {
    return prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
      select: { id: true, nameAr: true, nameEn: true },
    })
  },

  async listCategories(brandId: string) {
    return prisma.category.findMany({
      where: { brandId, isActive: true },
      orderBy: { nameAr: 'asc' },
      select: { id: true, nameAr: true, nameEn: true, bodyType: true },
    })
  },

  async listModels(categoryId: string) {
    return prisma.model.findMany({
      where: { categoryId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })
  },
}

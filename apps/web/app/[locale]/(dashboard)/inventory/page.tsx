import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Plus } from 'lucide-react'
import { requirePageUser } from '@/lib/auth-guard'
import { carRepository } from '@/repositories/car.repository'
import { carFilterSchema } from '@/lib/validations/car.schema'
import { InventoryView } from '@/components/features/cars/InventoryView'
import type { CarCardData } from '@/components/features/cars/CarCard'
import { Pagination } from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'

export default async function InventoryPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const t = await getTranslations('nav')
  const ti = await getTranslations('inventoryPage')
  const user = await requirePageUser()
  const prefix = locale === 'ar' ? '' : '/en'

  const parsed = carFilterSchema.safeParse(searchParams)
  const filters = parsed.success ? parsed.data : carFilterSchema.parse({})

  let cars: CarCardData[] = []
  let total = 0
  let page = filters.page
  let pageSize = filters.pageSize
  try {
    const result = await carRepository.findByShowroom(user.showroomId, filters)
    total = result.total
    page = result.page
    pageSize = result.pageSize
    cars = result.cars.map((c) => ({
      id: c.id,
      carRefNumber: c.carRefNumber,
      brandName: c.brand.nameAr,
      categoryName: c.category.nameAr,
      year: c.year,
      odometer: c.odometer,
      fuelType: c.fuelType,
      sellPrice: c.sellPrice ? Number(c.sellPrice) : null,
      status: c.status,
      coverImage: c.images[0]?.url ?? null,
    }))
  } catch {
    // DB unavailable — render empty state
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-cl-primary">{t('inventory')}</h1>
        <Link href={`${prefix}/inventory/new`} className="btn-primary">
          <Plus size={18} /> {ti('addCar')}
        </Link>
      </div>

      <InventoryView cars={cars} />

      <Pagination total={total} page={page} pageSize={pageSize} />
    </div>
  )
}

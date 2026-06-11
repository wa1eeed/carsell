import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requirePageUser } from '@/lib/auth-guard'
import { carRepository } from '@/repositories/car.repository'
import { prisma } from '@/lib/prisma'
import { SaleForm } from '@/components/features/sales/SaleForm'

export const dynamic = 'force-dynamic'

export default async function NewSalePage({ params }: { params: { carId: string; locale: string } }) {
  const t = await getTranslations('sale')
  const user = await requirePageUser()
  const prefix = params.locale === 'ar' ? '' : '/en'

  const car = await carRepository.findById(params.carId, user.showroomId)
  if (!car) notFound()
  if (car.status === 'SOLD') redirect(`${prefix}/inventory/${car.id}`)

  const showroom = await prisma.showroom.findUnique({ where: { id: user.showroomId } })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-cl-primary">{t('title')}</h1>
      <SaleForm
        carId={car.id}
        carTitle={`${car.brand.nameAr} ${car.category.nameAr} ${car.year}`}
        carType={car.carType}
        purchasePrice={Number(car.purchasePrice)}
        extraCosts={Number(car.extraCosts)}
        defaultSellPrice={car.sellPrice ? Number(car.sellPrice) : 0}
        profitMarginApproved={showroom?.profitMarginApproved ?? false}
        marketEnabled={(showroom?.marketplaceEnabled ?? false) && car.listedOnMarket}
      />
    </div>
  )
}

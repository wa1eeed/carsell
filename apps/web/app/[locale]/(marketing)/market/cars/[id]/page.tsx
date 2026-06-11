import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMarketCar } from '@/repositories/market.repository'
import MarketCarDetailClient from './MarketCarDetailClient'

export const revalidate = 60

interface Props { params: { id: string; locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await getMarketCar(params.id)
  if (!car) return { title: 'سيارة غير موجودة' }
  return {
    title: `${car.brand.nameAr} ${car.category.nameAr} ${car.year} — CarSell Live`,
    description: `${car.brand.nameAr} ${car.category.nameAr} ${car.year} للبيع في ${car.showroom.city ?? 'السعودية'}`,
    openGraph: {
      images: car.images[0] ? [{ url: car.images[0].url }] : [],
    },
  }
}

export default async function MarketCarDetailPage({ params }: Props) {
  const car = await getMarketCar(params.id)
  if (!car) notFound()
  return <MarketCarDetailClient car={car} locale={params.locale} />
}

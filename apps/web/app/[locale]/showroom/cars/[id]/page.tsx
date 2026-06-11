import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { showroomPublicRepository } from '@/repositories/showroom-public.repository'
import { ShowroomHeader } from '@/components/features/showroom/ShowroomHeader'
import { PublicCarDetail, type PublicCarDetailData } from '@/components/features/showroom/PublicCarDetail'
import type { SaudiPlateType } from '@/lib/saudi-plate'

export const revalidate = 60

function resolveSlug(searchParams: Record<string, string | string[] | undefined>): string | null {
  const headerSlug = headers().get('x-showroom-slug')
  if (headerSlug) return headerSlug
  const qp = searchParams.showroom
  return typeof qp === 'string' ? qp : null
}

async function resolveShowroom(searchParams: Record<string, string | string[] | undefined>) {
  const customDomain = headers().get('x-showroom-domain')
  if (customDomain) {
    const byDomain = await showroomPublicRepository.findShowroomByDomain(customDomain).catch(() => null)
    if (byDomain) return byDomain
  }
  const slug = resolveSlug(searchParams)
  if (slug) return showroomPublicRepository.findShowroom(slug).catch(() => null)
  return null
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: Record<string, string | string[] | undefined>
}): Promise<Metadata> {
  const showroom = await resolveShowroom(searchParams)
  if (!showroom) return { title: 'CarSell' }
  const car = await showroomPublicRepository.findCar(showroom.id, params.id).catch(() => null)
  if (!car) return { title: showroom.name }
  return {
    title: `${car.brand.nameAr} ${car.category.nameAr} ${car.year} — ${showroom.name}`,
    description: `${car.brand.nameAr} ${car.category.nameAr} ${car.year} للبيع لدى ${showroom.name}`,
    openGraph: { images: car.images[0] ? [car.images[0].url] : [] },
  }
}

export default async function ShowroomCarPage({
  params,
  searchParams,
}: {
  params: { id: string; locale: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const showroom = await resolveShowroom(searchParams)
  if (!showroom) notFound()

  const car = await showroomPublicRepository.findCar(showroom.id, params.id)
  if (!car) notFound()

  const data: PublicCarDetailData = {
    id: car.id,
    brandName: car.brand.nameAr,
    categoryName: car.category.nameAr,
    modelName: car.model.name,
    year: car.year,
    carType: car.carType,
    status: car.status,
    vin: car.vin,
    colorExt: car.colorExt,
    fuelType: car.fuelType,
    transmission: car.transmission,
    odometer: car.odometer,
    sellPrice: car.sellPrice ? Number(car.sellPrice) : null,
    plateNumber: car.plateNumber,
    plateType: (car.plateType as SaudiPlateType | null) ?? null,
    images: car.images.map((i) => i.url),
  }

  return (
    <div className="min-h-screen bg-cl-gray-50">
      <ShowroomHeader
        showroom={{
          name: showroom.name,
          city: showroom.city,
          logoUrl: showroom.logoUrl,
          coverImageUrl: showroom.coverImageUrl,
          tagline: showroom.tagline,
          whatsapp: showroom.whatsapp,
          phone: showroom.phone,
          instagramUrl: showroom.instagramUrl,
        }}
      />
      <PublicCarDetail car={data} whatsapp={showroom.whatsapp} phone={showroom.phone} showPrices={showroom.showPrices} />
      <footer className="border-t border-cl-gray-200 py-6 text-center text-xs text-cl-gray-400">
        مدعوم بـ <span className="text-cl-primary font-medium">CarSell</span>
      </footer>
    </div>
  )
}

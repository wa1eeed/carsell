import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { showroomPublicRepository, type ShowroomFilters } from '@/repositories/showroom-public.repository'
import { ShowroomHeader } from '@/components/features/showroom/ShowroomHeader'
import { ShowroomFilterBar } from '@/components/features/showroom/ShowroomFilterBar'
import { PublicCarCard, type PublicCarData } from '@/components/features/showroom/PublicCarCard'

export const revalidate = 60

function resolveSlug(searchParams: Record<string, string | string[] | undefined>): string | null {
  const headerSlug = headers().get('x-showroom-slug')
  if (headerSlug) return headerSlug
  const qp = searchParams.showroom
  return typeof qp === 'string' ? qp : null
}

/** Resolve a showroom from either the slug header or the custom-domain header */
async function resolveShowroom(searchParams: Record<string, string | string[] | undefined>) {
  // 1. Custom domain (dealer's own domain)
  const customDomain = headers().get('x-showroom-domain')
  if (customDomain) {
    const byDomain = await showroomPublicRepository.findShowroomByDomain(customDomain).catch(() => null)
    if (byDomain) return byDomain
  }
  // 2. Slug (subdomain, root path, or query param)
  const slug = resolveSlug(searchParams)
  if (slug) return showroomPublicRepository.findShowroom(slug).catch(() => null)
  return null
}

function parseFilters(sp: Record<string, string | string[] | undefined>): ShowroomFilters {
  const num = (v: string | string[] | undefined) => (typeof v === 'string' && v ? Number(v) : undefined)
  const str = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined)
  const cond = str(sp.condition)
  return {
    brandId: str(sp.brand),
    categoryId: str(sp.category),
    year: num(sp.year),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    condition: cond === 'NEW' || cond === 'USED' || cond === 'USED_QUALIFIED' ? cond : undefined,
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}): Promise<Metadata> {
  const showroom = await resolveShowroom(searchParams)
  if (!showroom) return { title: 'CarSell' }
  return {
    title: `${showroom.name} — سيارات للبيع`,
    description: `تصفّح سيارات ${showroom.name}${showroom.city ? ` في ${showroom.city}` : ''}`,
    openGraph: { images: showroom.logoUrl ? [showroom.logoUrl] : [] },
  }
}

export default async function ShowroomPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const tc = await getTranslations('common')
  const showroom = await resolveShowroom(searchParams)
  if (!showroom) notFound()

  const [cars, brands] = await Promise.all([
    showroomPublicRepository.listCars(showroom.id, parseFilters(searchParams)),
    showroomPublicRepository.listBrandsForShowroom(showroom.id),
  ])

  // Link strategy:
  //   - subdomain/custom-domain → links stay relative on same host
  //   - root pretty URL (carsell.one/{slug}) → links go to /{locale}/{slug}/...
  const onCustomHost = !!headers().get('x-showroom-slug') || !!headers().get('x-showroom-domain')
  const basePath  = onCustomHost && !headers().get('x-showroom-domain')
    ? `/${locale}/showroom`                       // subdomain
    : showroom.slug
      ? `/${locale}/${showroom.slug}`             // root pretty URL
      : `/${locale}/showroom`
  const linkQuery = onCustomHost ? '' : `?showroom=${encodeURIComponent(showroom.slug ?? '')}`
  const mapped: PublicCarData[] = cars.map((c) => ({
    id: c.id,
    brandName: c.brand.nameAr,
    categoryName: c.category.nameAr,
    year: c.year,
    odometer: c.odometer,
    fuelType: c.fuelType,
    sellPrice: c.sellPrice ? Number(c.sellPrice) : null,
    status: c.status,
    coverImage: c.images[0]?.url ?? null,
  }))

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
      <ShowroomFilterBar brands={brands} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {mapped.length === 0 ? (
          <div className="cl-card text-center text-cl-gray-400 py-16">{tc('noData')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapped.map((car) => (
              <PublicCarCard
                key={car.id}
                car={car}
                basePath={basePath}
                linkQuery={linkQuery}
                whatsapp={showroom.whatsapp}
                showPrices={showroom.showPrices}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-cl-gray-200 py-6 text-center text-xs text-cl-gray-400">
        مدعوم بـ <span className="text-cl-primary font-medium">CarSell</span>
      </footer>
    </div>
  )
}

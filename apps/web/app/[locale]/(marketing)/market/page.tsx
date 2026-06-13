import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { listMarketCars, getMarketFiltersData, getMarketHomepageData } from '@/repositories/market.repository'
import MarketClient from './MarketClient'
import MarketHome from './MarketHome'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'market' })
  return {
    title: t('title'),
    description: locale === 'ar'
      ? 'تصفح آلاف السيارات من معارض موثوقة في السعودية والخليج'
      : 'Browse thousands of cars from trusted showrooms across Saudi Arabia and the Gulf',
    openGraph: { type: 'website' },
  }
}

interface Props {
  params: { locale: string }
  searchParams: Record<string, string | undefined>
}

export default async function MarketPage({ params, searchParams }: Props) {
  const hasFilters = Object.keys(searchParams).some((k) =>
    ['brandId','categoryId','modelId','yearMin','yearMax','priceMin','priceMax',
     'city','carType','fuelType','transmission','bodyType','q','displayMode'].includes(k)
  )

  // Show homepage when no filters active
  if (!hasFilters && !searchParams.page) {
    const homeData = await getMarketHomepageData()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <MarketHome newCars={homeData.newCars as any} usedCars={homeData.usedCars as any} auctionCars={homeData.auctionCars as any} brands={homeData.brands} locale={params.locale} />
  }

  const filters = {
    brandId:      searchParams.brandId,
    categoryId:   searchParams.categoryId,
    modelId:      searchParams.modelId,
    yearMin:      searchParams.yearMin  ? Number(searchParams.yearMin)  : undefined,
    yearMax:      searchParams.yearMax  ? Number(searchParams.yearMax)  : undefined,
    priceMin:     searchParams.priceMin ? Number(searchParams.priceMin) : undefined,
    priceMax:     searchParams.priceMax ? Number(searchParams.priceMax) : undefined,
    city:         searchParams.city,
    carType:      searchParams.carType,
    fuelType:     searchParams.fuelType,
    transmission: searchParams.transmission,
    bodyType:     searchParams.bodyType,
    displayMode:  searchParams.displayMode as 'AUCTION' | undefined,
    search:       searchParams.q,
    page:         searchParams.page ? Number(searchParams.page) : 1,
    sortBy: searchParams.sort as
      | 'price_asc' | 'price_desc' | 'year_desc' | 'newest' | 'odometer_asc'
      | undefined,
  }

  const [result, filtersData] = await Promise.all([
    listMarketCars(filters),
    getMarketFiltersData(),
  ])

  return (
    <MarketClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cars={result.cars as any}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      filtersData={filtersData}
      currentFilters={filters}
    />
  )
}

import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { listMarketCars, getMarketFiltersData } from '@/repositories/market.repository'
import MarketClient from './MarketClient'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'market' })
  return {
    title: t('title'),
    description: locale === 'ar'
      ? 'تصفح آلاف السيارات من معارض موثوقة في السعودية والخليج'
      : 'Browse thousands of cars from trusted showrooms across Saudi Arabia and the Gulf',
    openGraph: {
      type: 'website',
    },
  }
}

interface Props {
  searchParams: Record<string, string | undefined>
}

export default async function MarketPage({ searchParams }: Props) {
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

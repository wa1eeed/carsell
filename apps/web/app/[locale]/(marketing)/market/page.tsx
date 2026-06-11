import type { Metadata } from 'next'
import { listMarketCars, getMarketFiltersData } from '@/repositories/market.repository'
import MarketClient from './MarketClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'CarSell Live — سوق السيارات الخليجي',
  description: 'تصفح آلاف السيارات من معارض موثوقة في السعودية والخليج',
}

interface Props {
  searchParams: Record<string, string | undefined>
}

export default async function MarketPage({ searchParams }: Props) {
  const filters = {
    brandId:     searchParams.brandId,
    categoryId:  searchParams.categoryId,
    yearMin:     searchParams.yearMin  ? Number(searchParams.yearMin)  : undefined,
    yearMax:     searchParams.yearMax  ? Number(searchParams.yearMax)  : undefined,
    priceMin:    searchParams.priceMin ? Number(searchParams.priceMin) : undefined,
    priceMax:    searchParams.priceMax ? Number(searchParams.priceMax) : undefined,
    city:        searchParams.city,
    carType:     searchParams.carType,
    fuelType:    searchParams.fuelType,
    transmission: searchParams.transmission,
    search:      searchParams.q,
    page:        searchParams.page ? Number(searchParams.page) : 1,
    sortBy:      searchParams.sort as 'price_asc' | 'price_desc' | 'year_desc' | 'newest' | undefined,
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

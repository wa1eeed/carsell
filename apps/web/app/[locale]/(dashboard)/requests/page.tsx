import { requirePageUser } from '@/lib/auth-guard'
import { requestRepository } from '@/repositories/request.repository'
import { RequestsClient } from './RequestsClient'
import type { CarRequestStatus } from '@prisma/client'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'الطلبات — CarSell' }

export default async function RequestsPage({ searchParams }: { searchParams: { status?: string } }) {
  const user = await requirePageUser()

  const valid = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'] as const
  const status = (valid as readonly string[]).includes(searchParams.status ?? '')
    ? (searchParams.status as CarRequestStatus)
    : undefined

  const [requests, counts] = await Promise.all([
    requestRepository.listForShowroom(user.showroomId, { status }),
    requestRepository.countsForShowroom(user.showroomId),
  ])

  // Serialize Decimal → number for the client component
  const data = requests.map((r) => ({
    id:          r.id,
    type:        r.type,
    status:      r.status,
    buyerName:   r.buyerName,
    buyerPhone:  r.buyerPhone,
    offerAmount: r.offerAmount ? Number(r.offerAmount) : null,
    message:     r.message,
    dealerNote:  r.dealerNote,
    createdAt:   r.createdAt.toISOString(),
    car: {
      ref:        r.car.carRefNumber,
      year:       r.car.year,
      sellPrice:  r.car.sellPrice ? Number(r.car.sellPrice) : null,
      brandAr:    r.car.brand.nameAr,
      brandEn:    r.car.brand.nameEn,
      categoryAr: r.car.category.nameAr,
      categoryEn: r.car.category.nameEn,
      cover:      r.car.images[0]?.url ?? null,
    },
  }))

  return <RequestsClient requests={data} counts={counts} activeStatus={status ?? 'PENDING'} />
}

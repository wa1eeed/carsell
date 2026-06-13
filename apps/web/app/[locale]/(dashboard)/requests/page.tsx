import { requirePageUser } from '@/lib/auth-guard'
import { requestRepository } from '@/repositories/request.repository'
import { RequestsClient } from './RequestsClient'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'الطلبات — CarSell' }

const VALID_STATUSES = [
  'PENDING', 'RESERVED', 'WAITING_PAYMENT', 'OWNERSHIP_TRANSFER', 'COMPLETED', 'REJECTED', 'CANCELLED',
] as const
type Status = typeof VALID_STATUSES[number]

export default async function RequestsPage({ searchParams }: { searchParams: { status?: string } }) {
  const user = await requirePageUser()

  const status: Status = (VALID_STATUSES as readonly string[]).includes(searchParams.status ?? '')
    ? (searchParams.status as Status)
    : 'PENDING'

  const [requests, counts] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestRepository.listForShowroom(user.showroomId, { status: status as any }),
    requestRepository.countsForShowroom(user.showroomId),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (requests as any[]).map((r) => ({
    id:          r.id,
    type:        r.type,
    status:      r.status,
    buyerName:   r.buyerName,
    buyerPhone:  r.buyerPhone,
    offerAmount: r.offerAmount ? Number(r.offerAmount) : null,
    message:     r.message,
    dealerNote:  r.dealerNote,
    createdAt:   r.createdAt.toISOString(),
    customer:    r.customer ?? null,
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

  return <RequestsClient requests={data} counts={counts} activeStatus={status} />
}

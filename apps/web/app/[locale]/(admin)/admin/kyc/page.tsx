import { kycRepository } from '@/repositories/kyc.repository'
import AdminKycClient from './AdminKycClient'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'طلبات التحقق KYC — CarSell Admin' }

const PAGE_SIZE = 20

export default async function AdminKycPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  const status = (searchParams.status as 'PENDING' | 'APPROVED' | 'REJECTED') ?? 'PENDING'
  const page   = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const [requests, counts] = await Promise.all([
    kycRepository.listByStatus(status, { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    kycRepository.counts(),
  ])

  return <AdminKycClient requests={requests} counts={counts} activeStatus={status} page={page} pageSize={PAGE_SIZE} />
}

import { kycRepository } from '@/repositories/kyc.repository'
import AdminKycClient from './AdminKycClient'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'طلبات التحقق KYC — CarLink Admin' }

export default async function AdminKycPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = (searchParams.status as 'PENDING' | 'APPROVED' | 'REJECTED') ?? 'PENDING'
  const [requests, counts] = await Promise.all([
    kycRepository.listByStatus(status),
    kycRepository.counts(),
  ])

  return <AdminKycClient requests={requests} counts={counts} activeStatus={status} />
}

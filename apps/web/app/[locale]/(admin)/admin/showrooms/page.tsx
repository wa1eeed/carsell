import { listSubscriptions } from '@/repositories/plan.repository'
import AdminShowroomsClient from './AdminShowroomsClient'

export const metadata = { title: 'إدارة المعارض — CarSell Admin' }

export default async function AdminShowroomsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const page = Number(searchParams.page ?? 1)
  const take = 20
  const validStatuses = ['TRIAL','ACTIVE','PAST_DUE','CANCELLED','EXPIRED','SUSPENDED'] as const
  type ValidStatus = typeof validStatuses[number]
  const rawStatus   = searchParams.status
  const statusFilter: ValidStatus | undefined =
    rawStatus && (validStatuses as readonly string[]).includes(rawStatus)
      ? (rawStatus as ValidStatus)
      : undefined

  const subs = await listSubscriptions({
    status: statusFilter,
    skip:   (page - 1) * take,
    take,
  })

  return <AdminShowroomsClient subscriptions={subs} page={page} />
}

import { listSubscriptions, listAllPlans } from '@/repositories/plan.repository'
import { prisma } from '@/lib/prisma'
import AdminShowroomsClient from './AdminShowroomsClient'

export const metadata = { title: 'إدارة المعارض — CarSell Admin' }

export default async function AdminShowroomsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const page = Number(searchParams.page ?? 1)
  const take = 25
  const validStatuses = ['TRIAL','ACTIVE','PAST_DUE','CANCELLED','EXPIRED','SUSPENDED'] as const
  type ValidStatus = typeof validStatuses[number]
  const rawStatus   = searchParams.status
  const statusFilter: ValidStatus | undefined =
    rawStatus && (validStatuses as readonly string[]).includes(rawStatus)
      ? (rawStatus as ValidStatus)
      : undefined

  const [subs, plans, totalShowrooms] = await Promise.all([
    listSubscriptions({ status: statusFilter, skip: (page - 1) * take, take }),
    listAllPlans(),
    prisma.showroom.count({ where: { slug: { not: '__platform__' } } }),
  ])

  return (
    <AdminShowroomsClient
      subscriptions={subs}
      plans={plans}
      totalShowrooms={totalShowrooms}
      page={page}
    />
  )
}

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getSubscriptionByShowroom } from '@/repositories/plan.repository'
import { listPublicPlans } from '@/repositories/plan.repository'
import BillingClient from './BillingClient'

export const metadata: Metadata = { title: 'الاشتراك والفواتير — CarLink' }

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/ar/login')

  const [subscription, plans] = await Promise.all([
    getSubscriptionByShowroom((session.user as { showroomId: string }).showroomId),
    listPublicPlans(),
  ])

  return <BillingClient subscription={subscription} plans={plans} />
}

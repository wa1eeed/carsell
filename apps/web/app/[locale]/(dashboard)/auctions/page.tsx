import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getSubscriptionByShowroom } from '@/repositories/plan.repository'
import { getTranslations } from 'next-intl/server'
import { PlanGate } from '@/components/features/billing/PlanGate'
import { ComingSoon } from '@/components/ui/ComingSoon'

export const dynamic = 'force-dynamic'

export default async function AuctionsPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect(`/${locale}/login`)

  const [subscription, t] = await Promise.all([
    getSubscriptionByShowroom(session.user.showroomId),
    getTranslations('auctionsPage'),
  ])

  return (
    <PlanGate feature="AUCTIONS" subscription={subscription}>
      <ComingSoon title={t('title')} />
    </PlanGate>
  )
}

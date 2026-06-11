import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layouts/DashboardShell'
import { SubscriptionBanner } from '@/components/features/billing/SubscriptionBanner'
import { getSubscriptionByShowroom } from '@/repositories/plan.repository'

export default async function DashboardLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect(`/${locale}/login`)

  const [showroom, subscription] = await Promise.all([
    prisma.showroom.findUnique({
      where: { id: session.user.showroomId },
      select: { name: true },
    }).catch(() => null),
    getSubscriptionByShowroom(session.user.showroomId).catch(() => null),
  ])

  const showroomName = showroom?.name ?? 'CarSell'

  return (
    <DashboardShell showroomName={showroomName}>
      {/* Subscription status banner */}
      <div className="mb-4">
        <SubscriptionBanner subscription={subscription} />
      </div>
      {children}
    </DashboardShell>
  )
}

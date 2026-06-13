import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROOT_DOMAIN } from '@/lib/constants'
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

  // Session separation: a PLATFORM_ADMIN session must never render the showroom
  // panel. Browsers share the auth cookie across tabs, so logging into the admin
  // panel in one tab and refreshing an open showroom tab would otherwise run the
  // showroom dashboard with an admin session — which crashed inner pages. Mirror
  // the admin layout (which sends showroom users to /dashboard) and send admins home.
  if (session.user.role === 'PLATFORM_ADMIN') redirect(`/${locale}/admin`)

  // Base fields (name + slug) — always available. Kept in a separate query so a
  // missing customDomain column in older DBs can't null out the whole result.
  const [showroom, subscription] = await Promise.all([
    prisma.showroom.findUnique({
      where: { id: session.user.showroomId },
      select: { name: true, slug: true },
    }).catch(() => null),
    getSubscriptionByShowroom(session.user.showroomId).catch(() => null),
  ])

  // Custom domain is optional and may not exist in older DBs — fetch defensively.
  const customDomainInfo = await prisma.showroom.findUnique({
    where: { id: session.user.showroomId },
    select: { customDomain: true, customDomainVerified: true },
  }).catch(() => null)

  const showroomName = showroom?.name ?? 'CarSell'
  // `__platform__` is the internal admin showroom — it has no public landing page
  const showroomSlug = showroom?.slug && showroom.slug !== '__platform__' ? showroom.slug : null
  // Locale prefix for platform URLs (as-needed: Arabic default has none, others do).
  // Without it, carsell.one/{slug} triggers a next-intl locale-detection redirect
  // that lands on the reserved internal /{locale}/showroom route — the bug users hit.
  const lp = locale === 'ar' ? '' : `/${locale}`
  // Use verified custom domain if set, otherwise fall back to carsell.one/{locale}/{slug}
  const showroomUrl = customDomainInfo?.customDomainVerified && customDomainInfo.customDomain
    ? `https://${customDomainInfo.customDomain}`
    : showroomSlug
      ? `https://${ROOT_DOMAIN}${lp}/${showroomSlug}`
      : null

  return (
    <DashboardShell showroomName={showroomName} showroomSlug={showroomSlug} showroomUrl={showroomUrl}>
      {/* Subscription status banner */}
      <div className="mb-4">
        <SubscriptionBanner subscription={subscription} />
      </div>
      {children}
    </DashboardShell>
  )
}

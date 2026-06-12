import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminShell } from '@/components/admin/AdminShell'

/**
 * Super Admin layout — completely separate from showroom dashboard.
 *
 * Routes under this group: /[locale]/admin/*
 * Accessible at: admin.carsell.one → rewrites to /ar/admin/*
 *
 * This layout does NOT tie to a showroomId.
 * Platform Admin manages all showrooms and platform settings.
 */
export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/${locale}/admin/login`)
  }

  if (session.user.role !== 'PLATFORM_ADMIN') {
    // Regular showroom users → back to their own dashboard
    redirect(`/${locale}/dashboard`)
  }

  return (
    <AdminShell adminName={session.user.name ?? 'Admin'}>
      {children}
    </AdminShell>
  )
}

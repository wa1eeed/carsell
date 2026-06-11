import { requirePageUser } from '@/lib/auth-guard'
import { showroomRepository } from '@/repositories/showroom.repository'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'الإعدادات — CarSell' }

export default async function SettingsPage() {
  const user     = await requirePageUser()
  const settings = await showroomRepository.getUrlSettings(user.showroomId)

  return (
    <SettingsClient
      slug={settings?.slug ?? null}
      showroomNumber={settings?.showroomNumber ?? null}
      customDomain={settings?.customDomain ?? null}
      customDomainVerified={settings?.customDomainVerified ?? false}
    />
  )
}

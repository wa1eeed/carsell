import { listPlatformSettings } from '@/repositories/plan.repository'
import AdminSettingsClient from './AdminSettingsClient'

export const metadata = { title: 'إعدادات المنصة — CarSell Admin' }

export default async function AdminSettingsPage() {
  const settings = await listPlatformSettings(true)
  return <AdminSettingsClient settings={settings} />
}

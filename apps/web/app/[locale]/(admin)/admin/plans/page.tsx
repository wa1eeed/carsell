import { listAllPlans } from '@/repositories/plan.repository'
import AdminPlansClient from './AdminPlansClient'

export const metadata = { title: 'إدارة الباقات — CarSell Admin' }

export default async function AdminPlansPage() {
  const plans = await listAllPlans()
  return <AdminPlansClient plans={plans} />
}

import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { listPublicPlans } from '@/repositories/plan.repository'
import PricingClient from './PricingClient'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'الأسعار — CarSell',
    description: 'اختر الباقة المناسبة لمعرضك',
  }
}

export default async function PricingPage() {
  const plans = await listPublicPlans()
  return <PricingClient plans={plans} />
}

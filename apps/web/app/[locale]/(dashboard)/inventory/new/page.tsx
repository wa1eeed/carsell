import { getTranslations } from 'next-intl/server'
import { requirePageUser } from '@/lib/auth-guard'
import { CarForm } from '@/components/features/cars/CarForm'

export default async function NewCarPage() {
  const t = await getTranslations('car')
  await requirePageUser()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-cl-primary">{t('addCar')}</h1>
      <CarForm />
    </div>
  )
}

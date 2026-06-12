import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-guard'
import { userRepository } from '@/repositories/user.repository'
import { OnboardingFlow } from '@/components/features/auth/OnboardingFlow'

export default async function OnboardingPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  let user
  try {
    const session = await requireAuth()
    user = await userRepository.findById(session.id)
  } catch {
    redirect(`/${locale}/login`)
  }
  if (!user) redirect(`/${locale}/login`)

  return (
    <OnboardingFlow
      accountType={user.accountType}
      completedSteps={user.completedSteps}
      nafathVerified={user.nafathVerified}
      kycStatus={user.kycStatus}
      initialPhone={user.phone ?? ''}
      initialCity={user.city ?? ''}
    />
  )
}

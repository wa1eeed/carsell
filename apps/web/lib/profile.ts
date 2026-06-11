import { AppError } from './errors'

/**
 * Profile completion gating.
 * Source: docs/screens/profile-completion.md — requiredSteps
 */

export type ProfileStep = 'personalInfo' | 'identity' | 'showroomInfo'

export const REQUIRED_STEPS: Record<string, ProfileStep[]> = {
  'car.create':      ['personalInfo', 'identity'],
  'car.list.market': ['personalInfo', 'identity', 'showroomInfo'],
  'sale.register':   ['personalInfo', 'identity'],
  'deposit.pay':     ['personalInfo', 'identity'],
  'auction.bid':     ['personalInfo', 'identity'],
  'car.browse':      [],
}

export class ProfileIncompleteError extends AppError {
  constructor(public readonly missing: ProfileStep[]) {
    super('PROFILE_INCOMPLETE', 'يجب إكمال الملف الشخصي قبل هذه العملية', 403)
  }
}

export function requireProfileComplete(completedSteps: string[], action: string): void {
  const required = REQUIRED_STEPS[action] ?? []
  const missing  = required.filter((r) => !completedSteps.includes(r))
  if (missing.length > 0) throw new ProfileIncompleteError(missing)
}

/**
 * Profile completion percentage.
 * Source: docs/screens/profile-completion.md
 */
export function calcProfileCompletion(input: {
  accountType: string
  completedSteps: string[]
}): number {
  const steps = [
    { key: 'account',      weight: 20, done: true },
    { key: 'personalInfo', weight: 30, done: input.completedSteps.includes('personalInfo') },
    { key: 'identity',     weight: 30, done: input.completedSteps.includes('identity') },
    {
      key: 'showroomInfo',
      weight: 20,
      done: input.accountType === 'INDIVIDUAL' || input.completedSteps.includes('showroomInfo'),
    },
  ]
  return steps.filter((s) => s.done).reduce((sum, s) => sum + s.weight, 0)
}

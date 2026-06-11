/**
 * Feature Gating — checks if a showroom's plan allows a feature.
 * Used in both API routes and UI components.
 */

import type { PlanFeatures } from '@/repositories/plan.repository'
import { getSubscriptionByShowroom } from '@/repositories/plan.repository'

export type Feature =
  | 'MARKET'
  | 'AUCTIONS'
  | 'API'
  | 'REPORTS_ADVANCED'
  | 'REPORTS_FULL'
  | 'CUSTOM_SHOWROOM'
  | 'TEAM_MEMBERS'

// Check if a plan's features include the requested feature
export function planHasFeature(features: PlanFeatures, feature: Feature): boolean {
  switch (feature) {
    case 'MARKET':          return features.market
    case 'AUCTIONS':        return features.auctions
    case 'API':             return features.api
    case 'REPORTS_ADVANCED': return features.reports === 'advanced' || features.reports === 'full'
    case 'REPORTS_FULL':    return features.reports === 'full'
    case 'CUSTOM_SHOWROOM': return features.customShowroom
    case 'TEAM_MEMBERS':    return (features.teamMembers ?? 0) > 1 || features.teamMembers === null
    default:                return false
  }
}

// Check if a showroom (by ID) can use a feature — includes subscription status check
export async function canUseFeature(showroomId: string, feature: Feature): Promise<boolean> {
  const sub = await getSubscriptionByShowroom(showroomId)
  if (!sub) return false
  // Expired / cancelled subscriptions lose features except during grace period
  if (sub.status === 'CANCELLED' || sub.status === 'EXPIRED') return false
  return planHasFeature(sub.plan.features, feature)
}

// Check car limit
export async function canAddCar(showroomId: string, currentCarCount: number): Promise<boolean> {
  const sub = await getSubscriptionByShowroom(showroomId)
  if (!sub) return false
  if (sub.status === 'CANCELLED' || sub.status === 'EXPIRED') return false
  if (sub.plan.maxCars === null) return true            // unlimited
  return currentCarCount < sub.plan.maxCars
}

// Throw 403 if feature not allowed (for use in API routes)
export async function requireFeature(showroomId: string, feature: Feature): Promise<void> {
  const allowed = await canUseFeature(showroomId, feature)
  if (!allowed) {
    const err = new Error(`FEATURE_LOCKED:${feature}`)
    ;(err as NodeJS.ErrnoException).code = 'FEATURE_LOCKED'
    throw err
  }
}

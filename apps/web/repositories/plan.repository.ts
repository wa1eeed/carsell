/**
 * Plan repository — all DB operations for plans & subscriptions.
 * No prisma.* calls outside this file for these models.
 */

import { prisma } from '@/lib/prisma'
import type { BillingPeriod, Plan, Subscription, SubscriptionStatus } from '@prisma/client'

// ── Plan features type ─────────────────────────────────────────────────────

export interface PlanFeatures {
  market: boolean
  auctions: boolean
  api: boolean
  reports: 'basic' | 'advanced' | 'full'
  support: 'email' | 'chat' | 'priority' | 'dedicated'
  customShowroom: boolean
  teamMembers: number | null  // null = unlimited
}

export type PlanWithFeatures = Omit<Plan, 'features'> & { features: PlanFeatures }

function parsePlan(plan: Plan): PlanWithFeatures {
  return { ...plan, features: plan.features as unknown as PlanFeatures }
}

// ── Plans ──────────────────────────────────────────────────────────────────

export async function listPublicPlans(): Promise<PlanWithFeatures[]> {
  const plans = await prisma.plan.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { sortOrder: 'asc' },
  })
  return plans.map(parsePlan)
}

export async function listAllPlans(): Promise<PlanWithFeatures[]> {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } })
  return plans.map(parsePlan)
}

export async function getPlanById(id: string): Promise<PlanWithFeatures | null> {
  const plan = await prisma.plan.findUnique({ where: { id } })
  return plan ? parsePlan(plan) : null
}

export async function getPlanBySlug(slug: string): Promise<PlanWithFeatures | null> {
  const plan = await prisma.plan.findUnique({ where: { slug } })
  return plan ? parsePlan(plan) : null
}

export async function createPlan(data: {
  name: string
  nameAr: string
  slug: string
  description?: string
  descriptionAr?: string
  priceMonthly: number
  priceYearly: number
  maxCars?: number | null
  features: PlanFeatures
  isActive?: boolean
  isPublic?: boolean
  isFeatured?: boolean
  sortOrder?: number
  trialDays?: number
}): Promise<PlanWithFeatures> {
  const plan = await prisma.plan.create({
    data: {
      ...data,
      features: data.features as object,
    },
  })
  return parsePlan(plan)
}

export async function updatePlan(
  id: string,
  data: Partial<{
    name: string
    nameAr: string
    slug: string
    description: string
    descriptionAr: string
    priceMonthly: number
    priceYearly: number
    maxCars: number | null
    features: PlanFeatures
    isActive: boolean
    isPublic: boolean
    isFeatured: boolean
    sortOrder: number
    trialDays: number
  }>,
): Promise<PlanWithFeatures> {
  const { features, ...rest } = data
  const plan = await prisma.plan.update({
    where: { id },
    data: features ? { ...rest, features: features as object } : rest,
  })
  return parsePlan(plan)
}

export async function deletePlan(id: string): Promise<void> {
  await prisma.plan.delete({ where: { id } })
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export type SubscriptionWithPlan = Subscription & { plan: PlanWithFeatures }

export async function getSubscriptionByShowroom(
  showroomId: string,
): Promise<SubscriptionWithPlan | null> {
  const sub = await prisma.subscription.findUnique({
    where: { showroomId },
    include: { plan: true },
  })
  if (!sub) return null
  return { ...sub, plan: parsePlan(sub.plan) }
}

export async function createSubscription(data: {
  showroomId: string
  planId: string
  billingPeriod: BillingPeriod
  trialEndsAt?: Date
  tapCustomerId?: string
}): Promise<Subscription> {
  return prisma.subscription.create({
    data: {
      showroomId: data.showroomId,
      planId: data.planId,
      billingPeriod: data.billingPeriod,
      status: 'TRIAL',
      trialEndsAt: data.trialEndsAt,
      tapCustomerId: data.tapCustomerId,
    },
  })
}

export async function updateSubscription(
  showroomId: string,
  data: Partial<{
    status: SubscriptionStatus
    planId: string
    billingPeriod: BillingPeriod
    trialEndsAt: Date | null
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelledAt: Date | null
    tapCustomerId: string
    tapCardId: string
    autoRenew: boolean
  }>,
): Promise<Subscription> {
  return prisma.subscription.update({ where: { showroomId }, data })
}

export async function listSubscriptions(opts?: {
  status?: SubscriptionStatus
  planId?: string
  skip?: number
  take?: number
}) {
  return prisma.subscription.findMany({
    where: {
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.planId ? { planId: opts.planId } : {}),
    },
    include: {
      plan: true,
      showroom: { select: { id: true, name: true, city: true, logoUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: opts?.skip ?? 0,
    take: opts?.take ?? 50,
  })
}

// ── Platform Settings ──────────────────────────────────────────────────────

export async function getPlatformSetting(key: string): Promise<string | null> {
  const s = await prisma.platformSetting.findUnique({ where: { key } })
  return s?.value ?? null
}

export async function setPlatformSetting(
  key: string,
  value: string,
  opts?: { isSecret?: boolean; updatedBy?: string },
): Promise<void> {
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value, isSecret: opts?.isSecret ?? false, updatedBy: opts?.updatedBy },
    update: { value, updatedBy: opts?.updatedBy },
  })
}

export async function listPlatformSettings(includeSecrets = false) {
  return prisma.platformSetting.findMany({
    where: includeSecrets ? undefined : { isSecret: false },
    orderBy: { key: 'asc' },
  })
}

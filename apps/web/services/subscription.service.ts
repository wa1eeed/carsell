/**
 * Subscription lifecycle service
 * Handles: start trial, initiate payment, handle webhook, cancel, upgrade
 */

import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { createTapCustomer, createCheckoutCharge } from '@/lib/tap/tap.service'
import {
  createSubscription,
  updateSubscription,
  getSubscriptionByShowroom,
  getPlanById,
} from '@/repositories/plan.repository'
import type { BillingPeriod } from '@prisma/client'

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://app.carsell.one'

// ── Start Trial ────────────────────────────────────────────────────────────

export async function startTrial(params: {
  showroomId: string
  planId: string
  billingPeriod: BillingPeriod
  userName: string
  userEmail?: string
  userPhone?: string
}): Promise<void> {
  const plan = await getPlanById(params.planId)
  if (!plan) throw new Error('Plan not found')

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays)

  // Create Tap customer
  let tapCustomerId: string | undefined
  try {
    const nameParts = params.userName.trim().split(' ')
    const customer = await createTapCustomer({
      firstName: nameParts[0] ?? params.userName,
      lastName: nameParts.slice(1).join(' ') || undefined,
      email: params.userEmail,
      phone: params.userPhone,
    })
    tapCustomerId = customer.id
  } catch (err) {
    logger.warn({ err }, 'subscription.service: failed to create Tap customer, continuing without')
  }

  await createSubscription({
    showroomId: params.showroomId,
    planId: params.planId,
    billingPeriod: params.billingPeriod,
    trialEndsAt,
    tapCustomerId,
  })

  logger.info({ showroomId: params.showroomId, planId: params.planId }, 'Trial started')
}

// ── Initiate Checkout ──────────────────────────────────────────────────────
// Returns a Tap charge URL that the frontend redirects to

export async function initiateCheckout(params: {
  showroomId: string
  userName: string
  userEmail?: string
  userPhone?: string
}): Promise<{ checkoutUrl: string; chargeId: string }> {
  const sub = await getSubscriptionByShowroom(params.showroomId)
  if (!sub) throw new Error('No subscription found for showroom')

  const isYearly = sub.billingPeriod === 'YEARLY'
  const amount = isYearly
    ? Number(sub.plan.priceYearly)
    : Number(sub.plan.priceMonthly)

  const period = isYearly ? 'سنوية' : 'شهرية'
  const description = `اشتراك CarSell — ${sub.plan.nameAr} (${period})`

  const charge = await createCheckoutCharge({
    amount,
    currency: 'SAR',
    description,
    firstName: params.userName.split(' ')[0] ?? params.userName,
    email: params.userEmail,
    phone: params.userPhone,
    subscriptionId: sub.id,
    redirectUrl: `${APP_URL}/ar/billing/callback?subscriptionId=${sub.id}`,
    webhookUrl: `${APP_URL}/api/v1/webhooks/tap`,
    saveCard: true,
  })

  // Record initiated payment
  await prisma.tapPayment.create({
    data: {
      subscriptionId: sub.id,
      tapChargeId: charge.id,
      amount,
      currency: 'SAR',
      status: 'INITIATED',
      description,
    },
  })

  const checkoutUrl = charge.transaction?.url ?? charge.redirect?.url ?? ''
  return { checkoutUrl, chargeId: charge.id }
}

// ── Handle Webhook ─────────────────────────────────────────────────────────

export async function handleTapWebhook(chargeId: string, status: string, cardId?: string): Promise<void> {
  const payment = await prisma.tapPayment.findUnique({ where: { tapChargeId: chargeId } })
  if (!payment) {
    logger.warn({ chargeId }, 'tap webhook: payment not found')
    return
  }

  const sub = await prisma.subscription.findUnique({ where: { id: payment.subscriptionId } })
  if (!sub) return

  if (status === 'CAPTURED') {
    const now = new Date()
    const isYearly = sub.billingPeriod === 'YEARLY'
    const periodEnd = new Date(now)
    if (isYearly) periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    else periodEnd.setMonth(periodEnd.getMonth() + 1)

    await Promise.all([
      prisma.tapPayment.update({
        where: { tapChargeId: chargeId },
        data: { status: 'CAPTURED', paidAt: now },
      }),
      updateSubscription(sub.showroomId, {
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        tapCardId: cardId ?? sub.tapCardId ?? undefined,
      }),
    ])
    logger.info({ showroomId: sub.showroomId }, 'Subscription activated')
  }

  if (status === 'FAILED' || status === 'TIMEDOUT') {
    await prisma.tapPayment.update({
      where: { tapChargeId: chargeId },
      data: { status: 'FAILED', failureReason: status },
    })
    // Move to PAST_DUE if was ACTIVE, keep TRIAL if still trialing
    if (sub.status === 'ACTIVE') {
      await updateSubscription(sub.showroomId, { status: 'PAST_DUE' })
    }
    logger.warn({ showroomId: sub.showroomId, status }, 'Payment failed')
  }
}

// ── Cancel ─────────────────────────────────────────────────────────────────

export async function cancelSubscription(showroomId: string): Promise<void> {
  await updateSubscription(showroomId, {
    status: 'CANCELLED',
    cancelledAt: new Date(),
    autoRenew: false,
  })
  logger.info({ showroomId }, 'Subscription cancelled')
}

// ── Change Plan ────────────────────────────────────────────────────────────

export async function changePlan(showroomId: string, newPlanId: string): Promise<void> {
  const plan = await getPlanById(newPlanId)
  if (!plan) throw new Error('Plan not found')
  await updateSubscription(showroomId, { planId: newPlanId })
  logger.info({ showroomId, newPlanId }, 'Plan changed')
}

/**
 * Tap.company service — higher-level operations
 */

import { tapRequest } from './tap.client'
import type {
  TapCustomer,
  TapCharge,
  TapCreateChargeInput,
} from './tap.types'

// ── Customers ──────────────────────────────────────────────────────────────

export async function createTapCustomer(params: {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
}): Promise<TapCustomer> {
  const body: Record<string, unknown> = {
    first_name: params.firstName,
    last_name: params.lastName ?? '',
  }
  if (params.email) body.email = params.email
  if (params.phone) {
    // Saudi numbers: +966XXXXXXXXX
    const cleaned = params.phone.replace(/\D/g, '')
    const country = cleaned.startsWith('966') ? '966' : '966'
    const number  = cleaned.startsWith('966') ? cleaned.slice(3) : cleaned
    body.phone = { country_code: country, number }
  }
  return tapRequest<TapCustomer>('POST', '/customers', body)
}

export async function retrieveTapCustomer(customerId: string): Promise<TapCustomer> {
  return tapRequest<TapCustomer>('GET', `/customers/${customerId}`)
}

// ── Charges ────────────────────────────────────────────────────────────────

export async function createCharge(input: TapCreateChargeInput): Promise<TapCharge> {
  return tapRequest<TapCharge>('POST', '/charges', input as unknown as Record<string, unknown>)
}

export async function retrieveCharge(chargeId: string): Promise<TapCharge> {
  return tapRequest<TapCharge>('GET', `/charges/${chargeId}`)
}

// ── Subscription payment (create recurring charge) ────────────────────────

export async function chargeSubscription(params: {
  amount: number
  currency: string
  description: string
  customerId: string
  savedCardId: string
  subscriptionId: string
  redirectUrl: string
  webhookUrl: string
}): Promise<TapCharge> {
  const input: TapCreateChargeInput = {
    amount: params.amount,
    currency: params.currency,
    customer_initiated: false,  // MIT (Merchant Initiated Transaction)
    threeDSecure: true,
    save_card: false,
    description: params.description,
    metadata: { subscription_id: params.subscriptionId },
    customer: { first_name: params.customerId },  // Tap requires name
    source: { id: params.savedCardId },
    post: { url: params.webhookUrl },
    redirect: { url: params.redirectUrl },
    receipt: { email: true, sms: false },
  }
  return createCharge(input)
}

// ── First-time checkout (customer enters card) ─────────────────────────────

export async function createCheckoutCharge(params: {
  amount: number
  currency: string
  description: string
  firstName: string
  email?: string
  phone?: string
  subscriptionId: string
  redirectUrl: string
  webhookUrl: string
  saveCard: boolean
}): Promise<TapCharge> {
  const input: TapCreateChargeInput = {
    amount: params.amount,
    currency: params.currency,
    customer_initiated: true,
    threeDSecure: true,
    save_card: params.saveCard,
    description: params.description,
    metadata: { subscription_id: params.subscriptionId },
    customer: {
      first_name: params.firstName,
      email: params.email,
      phone: params.phone
        ? { country_code: '966', number: params.phone.replace(/\D/g, '').replace(/^966/, '') }
        : undefined,
    },
    source: { id: 'src_all' },  // show all payment methods
    post: { url: params.webhookUrl },
    redirect: { url: params.redirectUrl },
    receipt: { email: !!params.email, sms: !!params.phone },
  }
  return createCharge(input)
}

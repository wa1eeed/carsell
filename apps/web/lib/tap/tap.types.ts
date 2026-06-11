// Tap.company API type definitions

export interface TapCustomer {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: TapPhone
}

export interface TapPhone {
  country_code: string
  number: string
}

export interface TapCard {
  id: string
  object: 'card'
  fingerprint: string
  brand: string
  last_four: string
  first_six: string
  name?: string
  expiry: { month: number; year: number }
}

export interface TapCharge {
  id: string
  object: 'charge'
  status: 'INITIATED' | 'CAPTURED' | 'AUTHORIZED' | 'CANCELLED' | 'FAILED' | 'VOID' | 'TIMEDOUT'
  amount: number
  currency: string
  description?: string
  customer: TapCustomer
  source?: { id: string }
  redirect?: { url: string; status: string }
  save_card?: boolean
  card?: TapCard
  payment_agreement?: { id: string; type: string }
  receipt?: { email: boolean; sms: boolean }
  created?: number
  transaction?: { url: string }
  reference?: { transaction: string; order: string }
}

export interface TapCreateChargeInput {
  amount: number
  currency: string
  customer_initiated: boolean
  threeDSecure: boolean
  save_card?: boolean
  description: string
  metadata?: Record<string, string>
  reference?: { transaction?: string; order?: string }
  receipt?: { email?: boolean; sms?: boolean }
  customer: {
    first_name: string
    last_name?: string
    email?: string
    phone?: TapPhone
  }
  source: { id: string }   // 'src_all' for card UI, or saved card token
  post?: { url: string }   // webhook
  redirect: { url: string }
}

export interface TapWebhookEvent {
  id: string
  object: 'event'
  api_version: string
  created: number
  data: { object: TapCharge }
  type: string   // 'charge.captured' | 'charge.failed' etc.
  live_mode: boolean
}

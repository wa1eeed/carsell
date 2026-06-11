import { VAT } from '@/lib/constants'

export type VatMethod = 'FULL_PRICE' | 'PROFIT_MARGIN'
export type CarTaxType = 'NEW' | 'USED' | 'USED_QUALIFIED'

export interface VatBreakdown {
  method: VatMethod
  vatBase: number
  vatAmount: number
  totalCost: number
  netProfit: number
  customerTotal: number
}

/**
 * Authoritative VAT calculation (server-side only — never trust the client).
 * Source: docs/business-logic/tax-rules.md
 *
 *   PROFIT_MARGIN applies ONLY when:
 *     car.carType === 'USED_QUALIFIED' AND showroom.profitMarginApproved === true
 *   Otherwise FULL_PRICE.
 */
export function resolveVatMethod(carType: CarTaxType, profitMarginApproved: boolean): VatMethod {
  if (carType === 'USED_QUALIFIED' && profitMarginApproved) return 'PROFIT_MARGIN'
  return 'FULL_PRICE'
}

export function computeVat(params: {
  carType: CarTaxType
  profitMarginApproved: boolean
  sellPrice: number
  purchasePrice: number
  extraCosts: number
  rate?: number
}): VatBreakdown {
  const rate = params.rate ?? VAT.RATE
  const method = resolveVatMethod(params.carType, params.profitMarginApproved)
  const totalCost = round2(params.purchasePrice + params.extraCosts)

  const vatBase =
    method === 'PROFIT_MARGIN' ? Math.max(0, params.sellPrice - params.purchasePrice) : params.sellPrice
  const vatAmount = round2(vatBase * rate)
  const netProfit = round2(params.sellPrice - totalCost - vatAmount)
  const customerTotal = round2(params.sellPrice + vatAmount)

  return { method, vatBase, vatAmount, totalCost, netProfit, customerTotal }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

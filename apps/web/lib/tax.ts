import { VAT } from './constants'

export type CarTaxType = 'NEW' | 'USED' | 'USED_QUALIFIED'

export interface VatResult {
  vatAmount: number
  vatBase: number
  method: 'FULL_PRICE' | 'PROFIT_MARGIN'
}

/**
 * VAT calculation. Authoritative version runs server-side (Phase 6 tax.service).
 *   USED_QUALIFIED → profit-margin: VAT = (sellPrice - purchasePrice) × rate
 *   all others     → full-price:    VAT = sellPrice × rate
 */
export function calcVat(params: {
  carType: CarTaxType
  sellPrice: number
  purchasePrice: number
  rate?: number
}): VatResult {
  const rate = params.rate ?? VAT.RATE
  if (params.carType === 'USED_QUALIFIED') {
    const margin = Math.max(0, params.sellPrice - params.purchasePrice)
    return { vatAmount: round2(margin * rate), vatBase: margin, method: 'PROFIT_MARGIN' }
  }
  return { vatAmount: round2(params.sellPrice * rate), vatBase: params.sellPrice, method: 'FULL_PRICE' }
}

export function calcNetProfit(params: {
  carType: CarTaxType
  sellPrice: number
  purchasePrice: number
  extraCosts: number
  rate?: number
}): { totalCost: number; vatAmount: number; netProfit: number; marginPct: number } {
  const totalCost = params.purchasePrice + params.extraCosts
  const { vatAmount } = calcVat(params)
  const netProfit = round2(params.sellPrice - totalCost - vatAmount)
  const marginPct = params.sellPrice > 0 ? round2((netProfit / params.sellPrice) * 100) : 0
  return { totalCost, vatAmount, netProfit, marginPct }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

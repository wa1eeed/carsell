import type { AuthUser } from '@/lib/auth'
import { AppError } from '@/lib/errors'
import logger from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { carRepository } from '@/repositories/car.repository'
import { requireProfileComplete } from '@/lib/profile'
import { userRepository } from '@/repositories/user.repository'
import { computeVat, type VatBreakdown } from './tax.service'
import type { CreateSaleInput } from '@/lib/validations/sale.schema'
import { scheduleMediaDeletion } from './media-cleanup.service'

export interface SaleResult {
  saleId: string
  breakdown: VatBreakdown & {
    financingFees: number
    platformFee: number
    customerPayable: number
  }
}

/**
 * Register a sale. VAT is computed server-side (never trusted from the client).
 * Creates Sale + SalePayment(s) (+ TradeIn, + PaymentTransaction if Market),
 * marks the car SOLD, and appends a SALE_REGISTERED timeline event — all atomically.
 */
export async function registerSale(user: AuthUser, carId: string, input: CreateSaleInput): Promise<SaleResult> {
  requireProfileComplete(await steps(user.id), 'sale.register')

  const car = await carRepository.findById(carId, user.showroomId)
  if (!car) throw new AppError('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)
  if (car.status === 'SOLD') throw new AppError('CAR_ALREADY_SOLD', 'السيارة مباعة بالفعل', 409)

  const showroom = await prisma.showroom.findUnique({ where: { id: user.showroomId } })
  if (!showroom) throw new AppError('SHOWROOM_NOT_FOUND', 'المعرض غير موجود', 404)

  const purchasePrice = Number(car.purchasePrice)
  const extraCosts = Number(car.extraCosts)

  // ── VAT (authoritative) ──
  const vat = computeVat({
    carType: car.carType,
    profitMarginApproved: showroom.profitMarginApproved,
    sellPrice: input.sellPrice,
    purchasePrice,
    extraCosts,
  })

  const financingFees = input.paymentMethod === 'FINANCING' || input.paymentMethod === 'MIXED' ? input.financing?.fees ?? 0 : 0
  const customerPayable = round2(vat.customerTotal + financingFees)

  // ── Marketplace commission (only when Market enabled AND car listed) ──
  const marketApplies = showroom.marketplaceEnabled && car.listedOnMarket
  const commissionPct = marketApplies ? Number(showroom.commissionPct ?? (await defaultCommission())) : 0
  const platformFee = round2((customerPayable * commissionPct) / 100)
  const netToShowroom = round2(customerPayable - platformFee)

  const saleId = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        showroomId: user.showroomId,
        name: input.buyer.name,
        phone: input.buyer.phone,
        idNumber: input.buyer.nationalId,
        email: input.buyer.email,
      },
    })

    const sale = await tx.sale.create({
      data: {
        carId,
        showroomId: user.showroomId,
        customerId: customer.id,
        sellPrice: input.sellPrice,
        purchasePrice,
        extraCosts,
        vatAmount: vat.vatAmount,
        netProfit: vat.netProfit,
        vatMethodUsed: vat.method,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        createdBy: user.id,
      },
    })

    // SalePayments — decompose the customer-payable amount by source
    const tradeInValue = input.tradeIn?.agreedValue ?? 0
    const financingAmount = input.financing?.amount ?? 0
    const cashPart = round2(customerPayable - tradeInValue - financingAmount)

    const payments: { amount: number; method: 'CASH' | 'FINANCING' | 'TRADE_IN'; reference?: string }[] = []
    if (tradeInValue > 0) payments.push({ amount: tradeInValue, method: 'TRADE_IN' })
    if (financingAmount > 0) payments.push({ amount: financingAmount, method: 'FINANCING', reference: input.financing?.provider })
    if (cashPart > 0 || payments.length === 0) payments.push({ amount: Math.max(0, cashPart), method: 'CASH' })

    await tx.salePayment.createMany({
      data: payments.map((p) => ({ saleId: sale.id, amount: p.amount, method: p.method, reference: p.reference })),
    })

    if (input.tradeIn) {
      await tx.tradeIn.create({
        data: {
          saleId: sale.id,
          showroomId: user.showroomId,
          brandId: input.tradeIn.brandId,
          categoryId: input.tradeIn.categoryId,
          modelId: input.tradeIn.modelId,
          year: input.tradeIn.year,
          colorExt: input.tradeIn.colorExt,
          odometer: input.tradeIn.odometer,
          vin: input.tradeIn.vin,
          condition: input.tradeIn.condition,
          estimatedValue: input.tradeIn.estimatedValue,
          agreedValue: input.tradeIn.agreedValue,
        },
      })
    }

    if (marketApplies) {
      await tx.paymentTransaction.create({
        data: {
          saleId: sale.id,
          showroomId: user.showroomId,
          buyerName: input.buyer.name,
          grossAmount: customerPayable,
          commissionPct,
          commissionAmt: platformFee,
          netToShowroom,
          status: 'held',
          heldAt: new Date(),
        },
      })
    }

    await tx.car.updateMany({
      where: { id: carId, showroomId: user.showroomId, deletedAt: null },
      data: { status: 'SOLD' },
    })

    await tx.carTimeline.create({
      data: {
        carId,
        userId: user.id,
        eventType: 'SALE_REGISTERED',
        payload: { customer: input.buyer.name, sellPrice: input.sellPrice, paymentMethod: input.paymentMethod },
      },
    })

    return sale.id
  })

  logger.info({ saleId, carId, showroomId: user.showroomId, method: vat.method }, 'sale.registered')

  // Schedule media deletion (photos/videos) after configured days
  // docs/ folder is kept permanently
  void scheduleMediaDeletion(carId, user.showroomId)

  return {
    saleId,
    breakdown: { ...vat, financingFees, platformFee, customerPayable },
  }
}

async function defaultCommission(): Promise<number> {
  const cfg = await prisma.platformConfig.findUnique({ where: { id: 'platform' } })
  return cfg ? Number(cfg.defaultCommissionPct) : 2.5
}

async function steps(userId: string): Promise<string[]> {
  const u = await userRepository.findById(userId)
  return u?.completedSteps ?? []
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

import { notFound } from 'next/navigation'
import { requirePageUser } from '@/lib/auth-guard'
import { carRepository } from '@/repositories/car.repository'
import { CarDetail, type CarDetailData } from '@/components/features/cars/CarDetail'
import type { SaudiPlateType } from '@/lib/saudi-plate'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function CarDetailPage({ params }: { params: { id: string; locale: string } }) {
  const user = await requirePageUser()

  // Support both UUID and carRefNumber in URL
  const isRef = /^\d+$/.test(params.id)
  const [car, showroom] = await Promise.all([
    isRef
      ? carRepository.findByRef(Number(params.id), user.showroomId)
      : carRepository.findById(params.id, user.showroomId),
    prisma.showroom.findUnique({ where: { id: user.showroomId }, select: { slug: true } }),
  ])
  if (!car) notFound()

  // Always fetch full car via findById to ensure all relations are included
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fullCar = await carRepository.findById((car as any).id, user.showroomId)
  if (!fullCar) notFound()

  const data: CarDetailData = {
    id:              fullCar.id,
    carRefNumber:    fullCar.carRefNumber,
    showroomSlug:    showroom?.slug ?? null,
    brandNameAr:     fullCar.brand.nameAr,
    brandNameEn:     fullCar.brand.nameEn,
    categoryNameAr:  fullCar.category.nameAr,
    categoryNameEn:  fullCar.category.nameEn,
    modelName:       fullCar.model.name,
    year:            fullCar.year,
    carType:         fullCar.carType,
    bodyType:        fullCar.bodyType ?? null,
    status:          fullCar.status,
    displayMode:     fullCar.displayMode,
    listedOnMarket:  fullCar.listedOnMarket,
    vin:             fullCar.vin,
    colorExt:        fullCar.colorExt,
    colorInt:        fullCar.colorInt,
    fuelType:        fullCar.fuelType,
    transmission:    fullCar.transmission,
    odometer:        fullCar.odometer,
    notes:           fullCar.notes,
    purchasePrice:   Number(fullCar.purchasePrice),
    extraCosts:      Number(fullCar.extraCosts),
    sellPrice:       fullCar.sellPrice        ? Number(fullCar.sellPrice)        : null,
    minAcceptedPrice: fullCar.minAcceptedPrice ? Number(fullCar.minAcceptedPrice) : null,
    plateNumber:     fullCar.plateNumber,
    plateType:       (fullCar.plateType as SaudiPlateType | null) ?? null,
    dataSource:      fullCar.dataSource,
    engineSize:      fullCar.engineSize,
    mojazReportUrl:  fullCar.mojazReportUrl,
    numberOfOwners:  fullCar.numberOfOwners,
    // Auction fields
    auctionType:          fullCar.auctionType ?? null,
    auctionSlug:          fullCar.auctionSlug ?? null,
    auctionStartAt:       fullCar.auctionStartAt?.toISOString() ?? null,
    auctionEndsAt:        fullCar.auctionEndsAt?.toISOString() ?? null,
    auctionOpeningPrice:  fullCar.auctionOpeningPrice  ? Number(fullCar.auctionOpeningPrice)  : null,
    auctionBuyNowPrice:   fullCar.auctionBuyNowPrice   ? Number(fullCar.auctionBuyNowPrice)   : null,
    auctionDepositAmount: fullCar.auctionDepositAmount ? Number(fullCar.auctionDepositAmount) : null,
    auctionBidIncrement:  (fullCar as any).auctionBidIncrement  ? Number((fullCar as any).auctionBidIncrement)  : null,
    images: fullCar.images.map((img) => ({ url: img.url, isCover: img.isCover })),
    timeline: fullCar.timeline.map((e) => ({
      id:        e.id,
      eventType: e.eventType,
      payload:   e.payload as Record<string, unknown>,
      userName:  e.user.name,
      createdAt: e.createdAt.toISOString(),
    })),
    documents: fullCar.documents.map((d) => ({
      id:       d.id,
      docType:  d.docType,
      fileName: d.fileName,
      fileUrl:  d.fileUrl,
    })),
    bids: ((fullCar as any).bids ?? []).map((b: any) => ({
      id:           b.id,
      amount:       Number(b.amount),
      isWinning:    b.isWinning,
      bidderName:   b.bidder.name,
      bidderNumber: null,
      createdAt:    b.createdAt.toISOString(),
    })),
    saumOffers: ((fullCar as any).carRequests ?? []).map((r: any) => ({
      id:          r.id,
      buyerName:   r.buyerName,
      buyerPhone:  r.buyerPhone,
      offerAmount: r.offerAmount ? Number(r.offerAmount) : null,
      status:      r.status,
      dealerNote:  r.dealerNote,
      createdAt:   r.createdAt.toISOString(),
    })),
  }

  return <CarDetail car={data} />
}

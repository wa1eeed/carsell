import { notFound } from 'next/navigation'
import { requirePageUser } from '@/lib/auth-guard'
import { carRepository } from '@/repositories/car.repository'
import { CarDetail, type CarDetailData } from '@/components/features/cars/CarDetail'
import type { SaudiPlateType } from '@/lib/saudi-plate'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function CarDetailPage({ params }: { params: { id: string; locale: string } }) {
  const user = await requirePageUser()
  const [car, showroom] = await Promise.all([
    carRepository.findById(params.id, user.showroomId),
    prisma.showroom.findUnique({ where: { id: user.showroomId }, select: { slug: true } }),
  ])
  if (!car) notFound()

  const data: CarDetailData = {
    id:           car.id,
    showroomSlug: showroom?.slug ?? null,
    brandName: car.brand.nameAr,
    categoryName: car.category.nameAr,
    modelName: car.model.name,
    year: car.year,
    carType: car.carType,
    status: car.status,
    vin: car.vin,
    colorExt: car.colorExt,
    colorInt: car.colorInt,
    fuelType: car.fuelType,
    transmission: car.transmission,
    odometer: car.odometer,
    notes: car.notes,
    purchasePrice: Number(car.purchasePrice),
    extraCosts: Number(car.extraCosts),
    sellPrice: car.sellPrice ? Number(car.sellPrice) : null,
    plateNumber: car.plateNumber,
    plateType: (car.plateType as SaudiPlateType | null) ?? null,
    dataSource: car.dataSource,
    engineSize: car.engineSize,
    mojazReportUrl: car.mojazReportUrl,
    numberOfOwners: car.numberOfOwners,
    timeline: car.timeline.map((e) => ({
      id:        e.id,
      eventType: e.eventType,
      payload:   e.payload as Record<string, unknown>,
      userName:  e.user.name,
      createdAt: e.createdAt.toISOString(),
    })),
    documents: car.documents.map((d) => ({
      id: d.id,
      docType: d.docType,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
    })),
  }

  return <CarDetail car={data} />
}

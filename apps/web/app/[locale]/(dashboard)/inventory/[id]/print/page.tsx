/**
 * Car Print Slip — /inventory/[id]/print
 *
 * Renders a clean printable A4 slip for the dealer to print and place
 * physically inside the car in their showroom.
 *
 * Contains:
 *   - Car photo (if available)
 *   - Car details (make, model, year, specs)
 *   - Sale price (large, prominent)
 *   - QR code linking to the public car detail page
 *   - Showroom name + contact info
 *
 * The page has @media print CSS that hides the browser UI and prints cleanly.
 */

import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { carRepository } from '@/repositories/car.repository'
import { prisma } from '@/lib/prisma'
import PrintSlipClient from './PrintSlipClient'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string; locale: string } }

export default async function PrintSlipPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect(`/${params.locale}/login`)

  const car = await carRepository.findById(params.id, session.user.showroomId)
  if (!car) notFound()

  const showroom = await prisma.showroom.findUnique({
    where: { id: session.user.showroomId },
    select: {
      name:           true,
      city:           true,
      logoUrl:        true,
      whatsapp:       true,
      phone:          true,
      showroomNumber: true,
      slug:           true,
    },
  })

  const brand    = await prisma.brand.findUnique({ where: { id: car.brandId }, select: { nameAr: true, nameEn: true } })
  const category = await prisma.category.findUnique({ where: { id: car.categoryId }, select: { nameAr: true } })
  const model    = await prisma.model.findUnique({ where: { id: car.modelId }, select: { name: true } })
  const coverImg = await prisma.carImage.findFirst({
    where: { carId: car.id, isCover: true },
    select: { url: true },
  })

  const publicUrl = `${process.env.NEXTAUTH_URL ?? 'https://carlink.sa'}/${params.locale}/market/cars/${car.id}`

  return (
    <PrintSlipClient
      car={{
        id:           car.id,
        carRefNumber: car.carRefNumber,
        year:         car.year,
        carType:      car.carType,
        odometer:     car.odometer,
        fuelType:     car.fuelType,
        transmission: car.transmission,
        colorExt:     car.colorExt,
        colorInt:     car.colorInt,
        engineSize:   car.engineSize,
        vin:          car.vin,
        plateNumber:  car.plateNumber,
        sellPrice:    car.sellPrice ? Number(car.sellPrice) : null,
        notes:        car.notes,
        brandNameAr:  brand?.nameAr ?? '',
        categoryName: category?.nameAr ?? '',
        modelName:    model?.name ?? '',
        coverImageUrl: coverImg?.url ?? null,
      }}
      showroom={{
        name:           showroom?.name ?? '',
        city:           showroom?.city ?? null,
        logoUrl:        showroom?.logoUrl ?? null,
        whatsapp:       showroom?.whatsapp ?? null,
        phone:          showroom?.phone ?? null,
        showroomNumber: showroom?.showroomNumber ?? null,
      }}
      publicUrl={publicUrl}
      locale={params.locale}
    />
  )
}

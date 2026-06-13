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

  // Support carPublicId (CS26000014), carRefNumber (numeric), or UUID in URL
  const isPublicId = /^CS\d{8}$/i.test(params.id)
  const isRef      = !isPublicId && /^\d+$/.test(params.id)
  const baseCar = isPublicId
    ? await carRepository.findByPublicId(params.id.toUpperCase(), session.user.showroomId)
    : isRef
      ? await carRepository.findByRef(Number(params.id), session.user.showroomId)
      : await carRepository.findById(params.id, session.user.showroomId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const car = (isRef || isPublicId) && baseCar
    ? await carRepository.findById((baseCar as any).id, session.user.showroomId)
    : baseCar as Awaited<ReturnType<typeof carRepository.findById>>
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

  const brand    = await prisma.brand.findUnique({ where: { id: car!.brandId }, select: { nameAr: true, nameEn: true } })
  const category = await prisma.category.findUnique({ where: { id: car!.categoryId }, select: { nameAr: true, nameEn: true } })
  const model    = await prisma.model.findUnique({ where: { id: car!.modelId }, select: { name: true } })
  const coverImg = await prisma.carImage.findFirst({
    where: { carId: car!.id, isCover: true },
    select: { url: true },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const carSlug = (car as any).carPublicId ?? car!.carRefNumber
  // Locale prefix (as-needed): Arabic default has none, others do. Required so the
  // public URL goes straight to /{locale}/{slug}/cars/... without a locale-detection
  // redirect that would expose the reserved internal /{locale}/showroom route.
  const lp = params.locale === 'ar' ? '' : `/${params.locale}`
  const publicUrl = showroom?.slug
    ? `https://carsell.one${lp}/${showroom.slug}/cars/${carSlug}`
    : `https://carsell.one${lp}/market/cars/${carSlug}`

  // Back link — direct href because print opens in a new tab (no history)
  const backUrl = `${lp}/inventory/${carSlug}`

  return (
    <PrintSlipClient
      car={{
        id:            car!.id,
        carRefNumber:  car!.carRefNumber,
        year:          car!.year,
        carType:       car!.carType,
        odometer:      car!.odometer,
        fuelType:      car!.fuelType,
        transmission:  car!.transmission,
        colorExt:      car!.colorExt,
        colorInt:      car!.colorInt,
        engineSize:    car!.engineSize,
        vin:           car!.vin,
        plateNumber:   car!.plateNumber,
        sellPrice:     car!.sellPrice ? Number(car!.sellPrice) : null,
        notes:         car!.notes,
        brandNameAr:   brand?.nameAr ?? '',
        brandNameEn:   brand?.nameEn ?? '',
        categoryNameAr: category?.nameAr ?? '',
        categoryNameEn: category?.nameEn ?? '',
        modelName:     model?.name ?? '',
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
      backUrl={backUrl}
    />
  )
}

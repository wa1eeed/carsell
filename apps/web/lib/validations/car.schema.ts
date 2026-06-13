import { z } from 'zod'
import { CAR_LIMITS, PAGINATION } from '../constants'

export const carImageInput = z.object({
  url:     z.string().min(1),
  isCover: z.boolean().optional(),
})

export const createCarSchema = z.object({
  brandId:       z.string().uuid(),
  categoryId:    z.string().uuid(),
  modelId:       z.string().uuid(),
  year:          z.number().int().min(1990).max(new Date().getFullYear() + 1),
  carType:       z.enum(['NEW', 'USED', 'USED_QUALIFIED']),
  colorExt:      z.string().max(50).optional(),
  colorInt:      z.string().max(50).optional(),
  fuelType:      z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC']).optional(),
  transmission:  z.enum(['AUTOMATIC', 'MANUAL']).optional(),
  odometer:      z.number().int().min(0).optional(),
  vin:           z.string().max(17).optional(),
  bodyType:      z.enum(['SUV', 'SEDAN', 'PICKUP', 'COUPE', 'HATCHBACK', 'VAN', 'CONVERTIBLE', 'WAGON']).optional(),
  status:        z.enum(['DRAFT', 'FOR_SALE', 'RESERVED']).default('DRAFT'),
  purchasePrice: z.number().positive().max(10_000_000),
  sellPrice:     z.number().positive().max(10_000_000).optional(),
  extraCosts:    z.number().min(0).default(0),
  plateNumber:   z.string().max(20).optional(),
  plateType:     z.enum(['PRIVATE', 'TAXI', 'TRANSPORT', 'DIPLOMAT']).optional(),
  notes:         z.string().max(2000).optional(),

  // VDM
  dataSource:        z.enum(['MANUAL', 'VDM_VIN', 'VDM_ABSHER']).default('MANUAL'),
  vdmSequenceNumber: z.string().optional(),
  engineSize:        z.string().optional(),

  images: z.array(carImageInput).max(CAR_LIMITS.MAX_IMAGES).optional(),
}).refine(
  (d) => d.status !== 'FOR_SALE' || (d.sellPrice != null && d.sellPrice > 0),
  { message: 'سعر البيع مطلوب عند العرض للبيع', path: ['sellPrice'] },
)

export const updateCarSchema = z.object({
  brandId:       z.string().uuid().optional(),
  categoryId:    z.string().uuid().optional(),
  modelId:       z.string().uuid().optional(),
  year:          z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  carType:       z.enum(['NEW', 'USED', 'USED_QUALIFIED']).optional(),
  colorExt:      z.string().max(50).optional(),
  colorInt:      z.string().max(50).optional(),
  fuelType:      z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC']).optional(),
  transmission:  z.enum(['AUTOMATIC', 'MANUAL']).optional(),
  odometer:      z.number().int().min(0).optional(),
  vin:           z.string().max(17).optional(),
  bodyType:      z.enum(['SUV', 'SEDAN', 'PICKUP', 'COUPE', 'HATCHBACK', 'VAN', 'CONVERTIBLE', 'WAGON']).optional(),
  status:        z.enum(['DRAFT', 'FOR_SALE', 'RESERVED']).optional(),
  purchasePrice: z.number().positive().max(10_000_000).optional(),
  sellPrice:     z.number().positive().max(10_000_000).optional(),
  extraCosts:    z.number().min(0).optional(),
  plateNumber:   z.string().max(20).optional(),
  plateType:     z.enum(['PRIVATE', 'TAXI', 'TRANSPORT', 'DIPLOMAT']).optional(),
  notes:         z.string().max(2000).optional(),
  engineSize:    z.string().optional(),
})

export const carFilterSchema = z.object({
  q:          z.string().max(50).optional(),
  brandId:    z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  year:       z.coerce.number().int().optional(),
  status:     z.enum(['DRAFT', 'FOR_SALE', 'AUCTION', 'RESERVED', 'SOLD']).optional(),
  minPrice:   z.coerce.number().optional(),
  maxPrice:   z.coerce.number().optional(),
  page:       z.coerce.number().int().min(1).default(1),
  pageSize:   z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
})

export const publishCarSchema = z.discriminatedUnion('mode', [
  z.object({
    mode:          z.literal('FIXED_PRICE'),
    sellPrice:     z.number().positive(),
    vatInclusive:  z.boolean().default(false),
    contactMethod: z.string().optional(),
    notes:         z.string().max(500).optional(),
  }),
  z.object({
    mode:             z.literal('SOUM'),
    displayPrice:     z.number().positive(),
    minAcceptedPrice: z.number().positive(),
    notes:            z.string().max(500).optional(),
  }),
  z.object({
    mode:                z.literal('AUCTION'),
    auctionType:         z.enum(['PUBLIC', 'PRIVATE']),
    openingPrice:        z.number().positive(),
    deposit:             z.number().min(0).optional(),
    bidIncrement:        z.number().min(100).optional(),
    startDate:           z.string().datetime(),
    durationHours:       z.union([z.literal(24), z.literal(48), z.literal(72), z.literal(168)]),
    buyNowPrice:         z.number().positive().optional(),
  }),
])

export type CreateCarInput  = z.infer<typeof createCarSchema>
export type UpdateCarInput  = z.infer<typeof updateCarSchema>
export type PublishCarInput = z.infer<typeof publishCarSchema>
export type CarFilterInput  = z.infer<typeof carFilterSchema>

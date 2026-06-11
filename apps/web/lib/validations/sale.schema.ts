import { z } from 'zod'

export const createSaleSchema = z
  .object({
    buyer: z.object({
      name:       z.string().min(2).max(200),
      phone:      z.string().regex(/^(05|\+9665)\d{8}$/, 'رقم جوال غير صحيح'),
      nationalId: z.string().max(20).optional(),
      email:      z.string().email().optional(),
    }),
    sellPrice:     z.number().positive().max(10_000_000),
    paymentMethod: z.enum(['CASH', 'FINANCING', 'TRADE_IN', 'MIXED']),
    notes:         z.string().max(2000).optional(),
    financing: z
      .object({
        provider: z.string().min(2).max(120),
        amount:   z.number().positive().max(10_000_000),
        fees:     z.number().min(0).max(1_000_000).default(0),
      })
      .optional(),
    tradeIn: z
      .object({
        brandId:        z.string().uuid().optional(),
        categoryId:     z.string().uuid().optional(),
        modelId:        z.string().uuid().optional(),
        year:           z.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
        colorExt:       z.string().max(50).optional(),
        odometer:       z.number().int().min(0).optional(),
        vin:            z.string().max(17).optional(),
        condition:      z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).default('GOOD'),
        estimatedValue: z.number().positive().max(10_000_000),
        agreedValue:    z.number().positive().max(10_000_000),
      })
      .optional(),
  })
  .refine((d) => d.paymentMethod !== 'FINANCING' || !!d.financing, {
    message: 'بيانات التمويل مطلوبة',
    path: ['financing'],
  })
  .refine((d) => d.paymentMethod !== 'TRADE_IN' || !!d.tradeIn, {
    message: 'بيانات سيارة البدل مطلوبة',
    path: ['tradeIn'],
  })
  .refine((d) => d.paymentMethod !== 'MIXED' || !!d.financing || !!d.tradeIn, {
    message: 'الدفع المختلط يتطلب تمويل أو بدل',
    path: ['paymentMethod'],
  })

export type CreateSaleInput = z.infer<typeof createSaleSchema>

import { z } from 'zod'

/**
 * Saudi mobile number — robust validator.
 * Accepts (and normalizes to 05XXXXXXXX): 05XXXXXXXX, 5XXXXXXXX,
 * +9665XXXXXXXX, 009665XXXXXXXX, 9665XXXXXXXX — with or without spaces/dashes.
 */
export function normalizeSaudiPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, '').replace(/^\+/, '').replace(/^00/, '')
  // 9665XXXXXXXX  → 05XXXXXXXX
  let local = digits
  if (local.startsWith('966')) local = local.slice(3)
  if (local.startsWith('5') && local.length === 9) local = '0' + local
  // must now be 05 + 8 digits
  return /^05\d{8}$/.test(local) ? local : null
}

const saudiPhone = z.string().transform((v, ctx) => {
  const n = normalizeSaudiPhone(v)
  if (!n) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'رقم جوال سعودي غير صحيح (مثال: 05XXXXXXXX)' })
    return z.NEVER
  }
  return n
})

export const registerSchema = z.object({
  accountType:   z.enum(['INDIVIDUAL', 'SHOWROOM', 'AGENCY', 'COMPANY']),
  name:          z.string().min(2, 'الاسم مطلوب').max(200),
  phone:         saudiPhone,
  email:         z.string().email('بريد إلكتروني غير صحيح').optional().or(z.literal('')),
  password:      z.string().min(8, 'كلمة المرور 8 أحرف على الأقل').max(100),
  // Nafath pre-fill (readonly when present)
  nationalId:    z.string().optional(),
  idType:        z.enum(['CITIZEN', 'RESIDENT', 'VISITOR']).optional(),
  // Subscription
  planId:        z.string().uuid().optional(),
  billingPeriod: z.enum(['MONTHLY', 'YEARLY']).optional(),
})

export const personalInfoSchema = z.object({
  phone:       saudiPhone,
  city:        z.string().min(2, 'المدينة مطلوبة').max(100),
  email:       z.string().email('بريد إلكتروني غير صحيح').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
})

export const identityManualSchema = z.object({
  nationalId:   z.string().min(10).max(11),
  idExpiryDate: z.string().min(1),
  kycDocFront:  z.string().min(1, 'صورة الهوية الأمامية مطلوبة'),
  kycDocBack:   z.string().optional(),
})

export const showroomInfoSchema = z.object({
  activityType:     z.enum(['showroom', 'agency', 'hall']),
  name:             z.string().min(2).max(200),
  city:             z.string().min(2).max(100),
  district:         z.string().optional(),
  commercialReg:    z.string().min(1),
  vatNumber:        z.string().optional(),
  whatsapp:         z.string().regex(/^(05|\+9665)\d{8}$/),
  instagramUrl:     z.string().url().optional(),
  logoUrl:          z.string().optional(),
  commercialRegDoc: z.string().min(1, 'صورة السجل التجاري مطلوبة'),
})

export type RegisterInput      = z.infer<typeof registerSchema>
export type PersonalInfoInput  = z.infer<typeof personalInfoSchema>
export type IdentityManualInput = z.infer<typeof identityManualSchema>
export type ShowroomInfoInput  = z.infer<typeof showroomInfoSchema>

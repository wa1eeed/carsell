import { z } from 'zod'

/**
 * International phone (E.164) — produced by the PhoneInput component as
 * +<dialcode><national>. Light validation: leading +, 8–15 digits total.
 * The PhoneInput already strips leading zeros and non-digits.
 */
const intlPhone = z.string().transform((v, ctx) => {
  const cleaned = v.replace(/[\s\-()]/g, '')
  if (!/^\+\d{8,15}$/.test(cleaned)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'رقم جوال غير صحيح' })
    return z.NEVER
  }
  return cleaned
})

export const registerSchema = z.object({
  accountType:   z.enum(['INDIVIDUAL', 'SHOWROOM', 'AGENCY', 'COMPANY']),
  name:          z.string().min(2, 'الاسم مطلوب').max(200),
  phone:         intlPhone,
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
  phone:       intlPhone,
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
  whatsapp:         intlPhone,
  instagramUrl:     z.string().url().optional(),
  logoUrl:          z.string().optional(),
  commercialRegDoc: z.string().min(1, 'صورة السجل التجاري مطلوبة'),
})

export type RegisterInput      = z.infer<typeof registerSchema>
export type PersonalInfoInput  = z.infer<typeof personalInfoSchema>
export type IdentityManualInput = z.infer<typeof identityManualSchema>
export type ShowroomInfoInput  = z.infer<typeof showroomInfoSchema>

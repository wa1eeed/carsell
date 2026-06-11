import { z } from 'zod'

export const registerSchema = z.object({
  accountType:   z.enum(['INDIVIDUAL', 'SHOWROOM', 'AGENCY', 'COMPANY']),
  name:          z.string().min(2).max(200),
  phone:         z.string().regex(/^(05|\+9665)\d{8}$/, 'رقم جوال سعودي غير صحيح'),
  email:         z.string().email().optional(),
  password:      z.string().min(8).max(100),
  // Nafath pre-fill (readonly when present)
  nationalId:    z.string().optional(),
  idType:        z.enum(['CITIZEN', 'RESIDENT', 'VISITOR']).optional(),
  // Subscription
  planId:        z.string().uuid().optional(),
  billingPeriod: z.enum(['MONTHLY', 'YEARLY']).optional(),
})

export const personalInfoSchema = z.object({
  phone:       z.string().regex(/^(05|\+9665)\d{8}$/),
  city:        z.string().min(2).max(100),
  email:       z.string().email().optional(),
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

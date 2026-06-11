import { randomUUID } from 'crypto'

export type FileCategory = 'image' | 'document'

// ─── Key Builder ─────────────────────────────

/**
 * بناء مسار موحّد للملف داخل الـ bucket
 *
 * cars/{showroomId}/{carId}/images/{uuid}.webp
 * cars/{showroomId}/{carId}/documents/{uuid}_inspection.pdf
 * showrooms/{showroomId}/logo.webp
 */
export function buildCarFileKey(params: {
  showroomId: string
  carId: string
  category: FileCategory
  ext: string
  prefix?: string
}): string {
  const { showroomId, carId, category, ext, prefix } = params
  const uuid = randomUUID()
  const filename = prefix ? `${uuid}_${prefix}.${ext}` : `${uuid}.${ext}`
  return `cars/${showroomId}/${carId}/${category}s/${filename}`
}

export function buildShowroomLogoKey(showroomId: string, ext: string): string {
  return `showrooms/${showroomId}/logo.${ext}`
}

// ─── Validation ───────────────────────────────

const RULES = {
  image: {
    types: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    maxSize: 10 * 1024 * 1024,   // 10 MB
    maxCount: 20,
    label: 'الصورة',
    allowed: 'JPG, PNG, WEBP, HEIC',
  },
  document: {
    types: ['application/pdf'],
    maxSize: 20 * 1024 * 1024,   // 20 MB
    maxCount: 10,
    label: 'المستند',
    allowed: 'PDF فقط',
  },
} as const

export function validateFileUpload(params: {
  contentType: string
  size: number
  category: FileCategory
}): { ok: true } | { ok: false; error: string } {
  const rule = RULES[params.category]

  if (!rule.types.includes(params.contentType as any))
    return { ok: false, error: `صيغة ${rule.label} غير مدعومة. المقبول: ${rule.allowed}` }

  if (params.size > rule.maxSize)
    return {
      ok: false,
      error: `حجم ${rule.label} يتجاوز الحد الأقصى (${rule.maxSize / 1024 / 1024} MB)`,
    }

  return { ok: true }
}

export function getExtFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg':      'jpg',
    'image/png':       'png',
    'image/webp':      'webp',
    'image/heic':      'heic',
    'application/pdf': 'pdf',
  }
  return map[contentType] ?? 'bin'
}

export function getMaxCount(category: FileCategory): number {
  return RULES[category].maxCount
}

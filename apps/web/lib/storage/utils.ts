/**
 * R2 / S3 Storage utilities — CarSell
 *
 * Bucket structure (two folders per car, strict isolation):
 *
 *   showrooms/{showroomId}/
 *     logo.webp
 *     cars/{carId}/
 *       media/          ← Car photos + videos (AUTO-DELETED after sale/removal)
 *         cover.jpg
 *         {uuid}.jpg
 *         {uuid}.mp4
 *       docs/           ← Invoices, PDFs, documents (KEPT PERMANENTLY)
 *         {uuid}_purchase-invoice.pdf
 *         {uuid}_inspection.pdf
 *
 * Security rules:
 *   - Every key is scoped to showroomId — cross-tenant access is structurally impossible
 *   - Presigned URLs expire in STORAGE_EXPIRY.UPLOAD_URL seconds
 *   - Upload path is validated server-side before issuing URL
 */

import { randomUUID } from 'crypto'

// ─── Folder types ─────────────────────────────────────────────────────────

/** media = car photos/videos — auto-deleted after sale */
export type CarFolder = 'media' | 'docs'

/** Legacy alias kept for backward compat */
export type FileCategory = 'image' | 'document'

function folderFromCategory(category: FileCategory): CarFolder {
  return category === 'image' ? 'media' : 'docs'
}

// ─── Key builders ─────────────────────────────────────────────────────────

/**
 * Build a scoped R2 key for a car file.
 * Pattern:  showrooms/{showroomId}/cars/{carId}/{folder}/{uuid}[_prefix].{ext}
 *
 * The showroomId prefix ensures:
 *   - Bucket policies can restrict by prefix
 *   - Cross-tenant access requires knowing another showroom's UUID (infeasible)
 *   - Cleanup jobs can target a folder without touching other tenants
 */
export function buildCarFileKey(params: {
  showroomId:  string
  carId:       string
  category:    FileCategory
  ext:         string
  prefix?:     string
}): string {
  const folder = folderFromCategory(params.category)
  return buildCarFolderKey({ ...params, folder })
}

export function buildCarFolderKey(params: {
  showroomId: string
  carId:      string
  folder:     CarFolder
  ext:        string
  prefix?:    string
}): string {
  const { showroomId, carId, folder, ext, prefix } = params
  const uuid     = randomUUID()
  const filename = prefix ? `${uuid}_${prefix}.${ext}` : `${uuid}.${ext}`
  return `showrooms/${showroomId}/cars/${carId}/${folder}/${filename}`
}

/** The R2 prefix for all media files of a car (used for bulk deletion) */
export function buildCarMediaPrefix(showroomId: string, carId: string): string {
  return `showrooms/${showroomId}/cars/${carId}/media/`
}

/** The R2 prefix for all doc files of a car */
export function buildCarDocsPrefix(showroomId: string, carId: string): string {
  return `showrooms/${showroomId}/cars/${carId}/docs/`
}

/** Showroom logo */
export function buildShowroomLogoKey(showroomId: string, ext: string): string {
  return `showrooms/${showroomId}/logo.${ext}`
}

/** KYC document — stored under platform/kyc, not per-showroom */
export function buildKycDocKey(userId: string, side: 'front' | 'back', ext: string): string {
  return `platform/kyc/${userId}/${side}.${ext}`
}

// ─── Validation ───────────────────────────────────────────────────────────

const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime'] as const
const DOC_TYPES   = ['application/pdf'] as const

const RULES = {
  image: {
    types:    MEDIA_TYPES,
    maxSize:  50 * 1024 * 1024,   // 50 MB (includes video)
    maxCount: 20,
    label:    'الصورة/الفيديو',
    allowed:  'JPG, PNG, WEBP, HEIC, MP4',
  },
  document: {
    types:    DOC_TYPES,
    maxSize:  20 * 1024 * 1024,   // 20 MB
    maxCount: 10,
    label:    'المستند',
    allowed:  'PDF فقط',
  },
} as const

export function validateFileUpload(params: {
  contentType: string
  size:        number
  category:    FileCategory
}): { ok: true } | { ok: false; error: string } {
  const rule = RULES[params.category]

  if (!(rule.types as readonly string[]).includes(params.contentType))
    return { ok: false, error: `صيغة ${rule.label} غير مدعومة. المقبول: ${rule.allowed}` }

  if (params.size > rule.maxSize)
    return { ok: false, error: `حجم ${rule.label} يتجاوز ${rule.maxSize / 1024 / 1024} MB` }

  return { ok: true }
}

export function getExtFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg':       'jpg',
    'image/png':        'png',
    'image/webp':       'webp',
    'image/heic':       'heic',
    'video/mp4':        'mp4',
    'video/quicktime':  'mov',
    'application/pdf':  'pdf',
  }
  return map[contentType] ?? 'bin'
}

export function getMaxCount(category: FileCategory): number {
  return RULES[category].maxCount
}

// ─── Path validation ──────────────────────────────────────────────────────

/**
 * Verify that an R2 key belongs to a specific showroom.
 * Used to prevent a showroom from reading/writing another tenant's files.
 */
export function keyBelongsToShowroom(key: string, showroomId: string): boolean {
  return key.startsWith(`showrooms/${showroomId}/`)
}

/**
 * Verify a key is in the correct folder for a given car.
 */
export function keyBelongsToCarFolder(key: string, showroomId: string, carId: string, folder: CarFolder): boolean {
  return key.startsWith(`showrooms/${showroomId}/cars/${carId}/${folder}/`)
}

/**
 * Locale-aware formatting helpers.
 * Prices/numbers/dates respect the active locale; price strings are rendered LTR by the UI.
 */

export function formatNumber(value: number | string, locale: string): string {
  const n = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(Number.isFinite(n) ? n : 0)
}

export function formatPrice(value: number | string, locale: string): string {
  const n = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0)
}

export function formatDate(value: Date | string, locale: string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'medium',
  }).format(d)
}

export function formatDateTime(value: Date | string, locale: string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

// ── Multi-tenant human-readable IDs ───────────────────────────────────────

/**
 * Format showroom platform ID: 1001 → "CL-1001"
 * Shown in Super Admin and invoices for cross-showroom identification.
 */
export function formatShowroomId(showroomNumber: number | null | undefined): string {
  if (!showroomNumber) return '—'
  return `CL-${showroomNumber}`
}

/**
 * Format car reference number within a showroom: 47 → "#47"
 * Each showroom has its own counter (showroom A #47 ≠ showroom B #47).
 * Used in inventory lists, sales records, and customer communications.
 */
export function formatCarRef(carRefNumber: number | null | undefined): string {
  if (!carRefNumber) return '—'
  return `#${carRefNumber}`
}

/**
 * Full car identifier combining showroom + car ref: "CL-1001 / #47"
 * Used in Super Admin and platform-wide references.
 */
export function formatCarFullRef(
  showroomNumber: number | null | undefined,
  carRefNumber: number | null | undefined,
): string {
  return `${formatShowroomId(showroomNumber)} / ${formatCarRef(carRefNumber)}`
}

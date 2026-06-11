export const CAR_LIMITS = {
  MAX_IMAGES: 20,
  MAX_DOCUMENTS: 10,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_DOC_SIZE_MB: 20,
} as const

export const STORAGE_EXPIRY = {
  IMAGE_PREVIEW:    60 * 60,
  DOCUMENT_VIEW:    60 * 15,
  DOCUMENT_DOWNLOAD: 60 * 5,
  UPLOAD_URL:       60 * 10,
} as const

export const VAT = {
  RATE: 0.15,
  METHODS: {
    FULL_PRICE:    'FULL_PRICE',
    PROFIT_MARGIN: 'PROFIT_MARGIN',
  },
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE:     100,
} as const

export const PLATE_LIMITS = {
  MIN_LETTERS: 1,
  MAX_LETTERS: 3,
  MIN_DIGITS:  1,
  MAX_DIGITS:  4,
} as const

export const AUTH = {
  ACCESS_TOKEN_MAX_AGE:  15 * 60,
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60,
} as const

export const LOCALES = ['ar', 'en'] as const
export const DEFAULT_LOCALE = 'ar' as const

export const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'carsell.one'

/**
 * Reserved path segments — these can NEVER be used as a showroom slug,
 * because they are real platform routes. Used by:
 *   - middleware (to decide if /{segment} is a showroom or a real page)
 *   - slug validation (block dealers from picking these)
 */
export const RESERVED_SLUGS = new Set<string>([
  // locales
  'ar', 'en',
  // marketing
  'market', 'pricing', 'showrooms', 'showroom', 'about', 'contact', 'terms', 'privacy', 'help',
  // auth
  'login', 'register', 'onboarding', 'logout', 'forgot-password', 'reset-password', 'verify',
  // dashboard
  'dashboard', 'inventory', 'sales', 'customers', 'reports', 'settings', 'billing', 'auctions',
  // admin
  'admin', 'super-admin',
  // system
  'api', '_next', 'static', 'assets', 'favicon.ico', 'robots.txt', 'sitemap.xml',
  // developer
  'developers', 'docs', 'sandbox', 'app', 'www', 'mail', 'ftp', 'cdn', 'status',
])

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase())
}

/**
 * CarSell — Security + Routing Middleware
 *
 * Layers (in order):
 *   1. Security headers (HSTS, CSP, X-Frame-Options, ...)
 *   2. Rate limiting (in-memory per IP — Redis in production)
 *   3. Domain routing (app.carsell.one / {slug}.carsell.one)
 *   4. i18n locale detection (next-intl)
 */

import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { LOCALES, DEFAULT_LOCALE, ROOT_DOMAIN, isReservedSlug } from '@/lib/constants'

// ─── Security Headers ──────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  // Prevent embedding in iframes (clickjacking)
  'X-Frame-Options': 'DENY',

  // XSS protection for older browsers
  'X-XSS-Protection': '1; mode=block',

  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',

  // Only send referrer on same-origin
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // HSTS — enforced for 1 year in production
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

  // Permissions policy — block unnecessary browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    // Next.js needs inline scripts for hydration
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.tap.company",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // R2 public URL for images
    `img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.r2.dev`,
    // Tap.company checkout
    "frame-src https://checkout.tap.company",
    "connect-src 'self' https://api.tap.company",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}

function applySecurityHeaders(res: NextResponse): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value)
  }
}

// ─── In-memory Rate Limiter ───────────────────────────────────────────────
//
// IMPORTANT: This is a per-edge-instance counter. In production with multiple
// instances, replace with Redis-backed rate limiting (Upstash, etc.).
//
// Limits defined per path pattern (requests per window):

interface RateLimitEntry { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMITS: { pattern: RegExp; max: number; windowMs: number }[] = [
  // Auth endpoints — strict limit (brute-force protection)
  { pattern: /^\/api\/v1\/auth\//, max: 10,  windowMs: 60_000  },
  // Nafath — external service, be gentle
  { pattern: /^\/api\/v1\/auth\/nafath\//, max: 5, windowMs: 60_000 },
  // Upload presign — prevent mass generation
  { pattern: /^\/api\/v1\/uploads\//, max: 50, windowMs: 60_000 },
  // Webhooks — Tap only, no IP limit here (handled by secret)
  { pattern: /^\/api\/v1\/webhooks\//, max: 200, windowMs: 60_000 },
  // General API
  { pattern: /^\/api\/v1\//, max: 200, windowMs: 60_000 },
]

function checkRateLimit(ip: string, path: string): { allowed: boolean; retryAfter?: number } {
  const rule = RATE_LIMITS.find((r) => r.pattern.test(path))
  if (!rule) return { allowed: true }

  const key  = `${ip}:${rule.pattern.source}`
  const now  = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs })
    return { allowed: true }
  }

  if (entry.count >= rule.max) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true }
}

// Periodic cleanup of expired entries (every 5 min)
let lastCleanup = 0
function cleanupRateLimitStore(): void {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60_000) return
  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) rateLimitStore.delete(key)
  }
}

// ─── i18n middleware ───────────────────────────────────────────────────────

const intlMiddleware = createIntlMiddleware({
  locales:       LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix:  'as-needed',
})

// ─── Main middleware ───────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hostname     = req.headers.get('host') ?? ''

  // Get real IP (trust Cloudflare / reverse proxy headers)
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'

  // ── API routes — rate limit then pass through (no locale handling) ─────
  if (pathname.startsWith('/api/')) {
    cleanupRateLimitStore()
    const { allowed, retryAfter } = checkRateLimit(ip, pathname)
    if (!allowed) {
      const res = NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
        { status: 429 },
      )
      if (retryAfter) res.headers.set('Retry-After', String(retryAfter))
      applySecurityHeaders(res)
      return res
    }
    // Pass API routes through with security headers — do NOT run i18n middleware
    const res = NextResponse.next()
    applySecurityHeaders(res)
    return res
  }

  // ── 1. Super Admin subdomain — admin.carsell.one ─────────────────────────
  if (hostname.startsWith('admin.')) {
    const url           = req.nextUrl.clone()
    const locale        = DEFAULT_LOCALE
    const matchedLocale = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
    const rest          = matchedLocale ? pathname.slice(`/${matchedLocale}`.length) : pathname
    // admin.carsell.one/plans → /{locale}/admin/plans
    url.pathname = `/${locale}/admin${rest === '/' ? '' : rest}`
    const res = NextResponse.rewrite(url)
    applySecurityHeaders(res)
    return res
  }

  // ── 2. Dashboard app subdomain — app.carsell.one ──────────────────────────
  // Route groups like (dashboard) don't add a URL prefix in Next.js —
  // routes are served at /{locale}/requests, /{locale}/cars, etc.
  // No rewrite needed; auth is enforced at the layout level.
  if (hostname.startsWith('app.')) {
    const res = NextResponse.next()
    applySecurityHeaders(res)
    return res
  }

  // Strip port for hostname comparisons (localhost:3000 → localhost)
  const host = hostname.split(':')[0]
  const isLocalhost = host === 'localhost' || host === '127.0.0.1'
  const isPlatformHost = host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}` || isLocalhost

  // ── 3. Showroom subdomain — {slug}.carsell.one ───────────────────────────
  const isSubdomain =
    !isPlatformHost &&
    host !== ROOT_DOMAIN &&
    host.endsWith(`.${ROOT_DOMAIN}`)

  if (isSubdomain) {
    const slug = host.replace(`.${ROOT_DOMAIN}`, '')
    return rewriteToShowroom(req, { slug })
  }

  // ── 4. Custom domain — dealer's own domain (e.g. mydealership.com) ───────
  // Any hostname that is NOT a platform host and NOT a carsell subdomain
  // is treated as a custom domain. The showroom page resolves it by host header.
  if (!isPlatformHost && !host.endsWith(`.${ROOT_DOMAIN}`)) {
    return rewriteToShowroom(req, { customDomain: host })
  }

  // ── 5. Root-domain pretty URL — carsell.one/{slug} ───────────────────────
  // If the first path segment is NOT a reserved route, treat it as a showroom slug.
  const matchedLocalePrefix = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  const pathWithoutLocale   = matchedLocalePrefix ? pathname.slice(`/${matchedLocalePrefix}`.length) : pathname
  const firstSegment        = pathWithoutLocale.split('/').filter(Boolean)[0]

  if (firstSegment && !isReservedSlug(firstSegment)) {
    // /{slug} or /{slug}/cars/{id} → showroom storefront
    return rewriteToShowroom(req, { slug: firstSegment, isRootPath: true })
  }

  // ── 6. i18n for normal platform routes ──────────────────────────────────
  const res = intlMiddleware(req)
  applySecurityHeaders(res)
  return res
}

/**
 * Rewrite a request to the showroom storefront page, preserving any sub-path
 * (e.g. /cars/{id}). Sets a header so the page can resolve the right showroom.
 */
function rewriteToShowroom(
  req: NextRequest,
  opts: { slug?: string; customDomain?: string; isRootPath?: boolean },
): NextResponse {
  const { pathname } = req.nextUrl

  const matchedLocale = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  const locale = matchedLocale ?? DEFAULT_LOCALE
  let rest = matchedLocale ? pathname.slice(`/${matchedLocale}`.length) : pathname

  // For root-path pretty URLs, strip the leading /{slug} segment to get the sub-path
  if (opts.isRootPath && opts.slug) {
    rest = rest.replace(new RegExp(`^/${opts.slug}`), '')
  }

  // Build the internal showroom path. With localePrefix 'as-needed', the default
  // locale has no prefix (/showroom), and other locales do (/en/showroom).
  const localePrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  const internalPath = `${localePrefix}/showroom${rest === '/' ? '' : rest}`

  // Pass the slug/domain via REQUEST headers so the page's headers() can read them.
  const requestHeaders = new Headers(req.headers)
  if (opts.slug)         requestHeaders.set('x-showroom-slug', opts.slug)
  if (opts.customDomain) requestHeaders.set('x-showroom-domain', opts.customDomain)

  // Rebuild the request with the internal path, then let next-intl process it
  // (it will add the correct internal locale rewrite). This avoids fighting the
  // as-needed locale prefix behaviour.
  const rewrittenUrl = new URL(internalPath, req.url)
  const proxyReq = new NextRequest(rewrittenUrl, {
    headers: requestHeaders,
  })

  const res = intlMiddleware(proxyReq)

  // Carry the headers onto the final response too (visible for debugging)
  if (opts.slug)         res.headers.set('x-showroom-slug', opts.slug)
  if (opts.customDomain) res.headers.set('x-showroom-domain', opts.customDomain)
  applySecurityHeaders(res)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp|ico|woff2|css|js)$).*)'],
}

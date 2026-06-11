/**
 * Auth Guard — centralized authentication + authorization helpers
 *
 * Security model:
 *   - showroomId is ALWAYS from JWT (never from request body)
 *   - JWT is re-validated from DB every 5 min (see auth.ts)
 *   - Deactivated users get an empty showroomId in the token → 401 below
 */

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, type AuthUser } from './auth'
import { AppError } from './errors'

// ── API route guards ───────────────────────────────────────────────────────

/**
 * Require authentication. Returns AuthUser or throws 401.
 * showroomId is from JWT — structurally cannot be spoofed by request body.
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new AppError('UNAUTHORIZED', 'غير مصرح', 401)

  // Guard against stale/invalidated tokens (showroomId cleared in auth.ts)
  if (!session.user.showroomId) {
    throw new AppError('UNAUTHORIZED', 'الجلسة منتهية أو الحساب معطّل', 401)
  }

  return session.user
}

/**
 * Require PLATFORM_ADMIN role.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== 'PLATFORM_ADMIN') {
    throw new AppError('FORBIDDEN', 'هذه الصفحة للمشرفين فقط', 403)
  }
  return user
}

/**
 * Require one of the specified roles.
 */
export async function requireRole(roles: string[]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new AppError('FORBIDDEN', 'لا صلاحية لهذا الإجراء', 403)
  }
  return user
}

/**
 * Require the user to own (or have access to) a specific showroom.
 * PLATFORM_ADMIN can access any showroom.
 */
export async function requireShowroomAccess(showroomId: string): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== 'PLATFORM_ADMIN' && user.showroomId !== showroomId) {
    throw new AppError('FORBIDDEN', 'لا صلاحية للوصول لهذا المعرض', 403)
  }
  return user
}

// ── Page/layout guards ─────────────────────────────────────────────────────

/**
 * For server page/layout components — redirects to /login instead of throwing.
 */
export async function requirePageUser(locale = 'ar'): Promise<AuthUser> {
  const session = await getServerSession(authOptions)
  if (!session?.user || !session.user.showroomId) {
    redirect(locale === 'ar' ? '/login' : `/${locale}/login`)
  }
  return session.user
}

/**
 * For Super Admin pages — redirects to /dashboard if not admin.
 */
export async function requireAdminPage(locale = 'ar'): Promise<AuthUser> {
  const session = await getServerSession(authOptions)
  if (!session?.user || !session.user.showroomId) {
    redirect(locale === 'ar' ? '/login' : `/${locale}/login`)
  }
  if (session.user.role !== 'PLATFORM_ADMIN') {
    redirect(locale === 'ar' ? '/dashboard' : `/${locale}/dashboard`)
  }
  return session.user
}

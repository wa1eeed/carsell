/**
 * Tap.company HTTP client
 * Keys are loaded from PlatformSettings DB table (admin-managed).
 * Falls back to env vars for initial setup.
 */

import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

const TAP_BASE_URL = 'https://api.tap.company/v2'

type TapEnv = 'test' | 'live'

// ── Key resolution ─────────────────────────────────────────────────────────

async function getSecretKey(): Promise<string> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'tap_secret_key' },
    })
    if (setting?.value) return setting.value
  } catch {
    logger.warn('tap.client: falling back to env for secret key')
  }
  const key = process.env.TAP_SECRET_KEY
  if (!key) throw new Error('Tap secret key not configured')
  return key
}

export async function getPublicKey(): Promise<string> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'tap_public_key' },
    })
    if (setting?.value) return setting.value
  } catch {
    // fallback
  }
  return process.env.TAP_PUBLIC_KEY ?? ''
}

export async function getTapEnv(): Promise<TapEnv> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'tap_env' },
    })
    if (setting?.value === 'live') return 'live'
  } catch {
    // fallback
  }
  return process.env.TAP_ENV === 'live' ? 'live' : 'test'
}

// ── Core request ───────────────────────────────────────────────────────────

export async function tapRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const secretKey = await getSecretKey()
  const url = `${TAP_BASE_URL}${path}`

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = (await res.json()) as T & { errors?: unknown }

  if (!res.ok) {
    logger.error({ path, status: res.status, data }, 'Tap API error')
    throw new Error(`Tap API error ${res.status}: ${JSON.stringify(data)}`)
  }

  return data
}

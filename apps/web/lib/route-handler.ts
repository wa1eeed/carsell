import { NextResponse } from 'next/server'
import { isAppError } from './errors'
import { fail } from './api-response'
import logger from './logger'

/**
 * Wraps a route handler, converting AppError → structured fail response.
 */
export function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  return fn().catch((err: unknown) => {
    if (isAppError(err)) {
      return fail(err.code, err.message, err.status)
    }
    logger.error({ err }, 'route.unhandled_error')
    return fail('INTERNAL_ERROR', 'حدث خطأ غير متوقع', 500)
  })
}

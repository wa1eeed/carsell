import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export function ok<T>(data: T, meta?: object) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) })
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/** Namespaced helper — use this in new API routes */
export const apiResponse = {
  ok: <T>(data: T) => NextResponse.json({ success: true, ...data }),
  created: <T>(data: T) => NextResponse.json({ success: true, ...data }, { status: 201 }),
  unauthorized: () =>
    NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 }),
  forbidden: () =>
    NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 }),
  notFound: (msg = 'Not found') =>
    NextResponse.json({ success: false, error: msg }, { status: 404 }),
  /** Client error — invalid input, conflict, reserved value, etc. */
  badRequest: (msg: string) =>
    NextResponse.json({ success: false, error: msg }, { status: 400 }),
  /** Resource conflict — taken slug/domain/email */
  conflict: (msg: string) =>
    NextResponse.json({ success: false, error: msg }, { status: 409 }),
  validationError: (err: ZodError) =>
    NextResponse.json({ success: false, error: 'VALIDATION_ERROR', issues: err.errors }, { status: 422 }),
  serverError: (msg = 'Internal server error') =>
    NextResponse.json({ success: false, error: msg }, { status: 500 }),
}

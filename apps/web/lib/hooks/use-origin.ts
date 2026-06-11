'use client'

import { useState, useEffect } from 'react'
import { ROOT_DOMAIN } from '@/lib/constants'

/**
 * useOrigin — returns window.location.origin, but only after mount.
 *
 * Why: using `window.location.origin` directly during render causes a
 * hydration mismatch, because the server renders the production origin
 * (https://carsell.one) while the client renders the actual origin
 * (e.g. http://localhost:3000). React then errors:
 *   "Text content does not match server-rendered HTML"
 *
 * This hook returns the production origin on the server + first client render
 * (so they match), then updates to the real origin after mount.
 */
export function useOrigin(): string {
  const [origin, setOrigin] = useState(`https://${ROOT_DOMAIN}`)
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])
  return origin
}

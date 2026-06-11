'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ShieldCheck } from 'lucide-react'

const NAFATH_GREEN = '#2D8B55'

/**
 * "تسجيل عبر نفاذ الوطني" — official green button.
 * Initiates the Nafath Web OIDC session then redirects the user.
 */
export function NafathButton() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [loading, setLoading] = useState(false)

  async function startNafath() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/auth/nafath/session?locale=${locale}`)
      const json = await res.json()
      if (json.success && json.data?.redirectUrl) {
        window.location.href = json.data.redirectUrl
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={startNafath}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-input py-2.5 text-white font-medium text-sm disabled:opacity-60"
      style={{ background: NAFATH_GREEN }}
    >
      <ShieldCheck size={18} />
      {loading ? t('login') + '…' : t('loginWithNafath')}
    </button>
  )
}

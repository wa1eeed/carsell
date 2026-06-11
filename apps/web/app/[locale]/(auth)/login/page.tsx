'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { NafathButton } from '@/components/features/auth/NafathButton'

export default function LoginPage() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (res?.error) {
      setError(t('login') + ' — ' + tc('error'))
    } else {
      router.push(`/${locale}/dashboard`)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-cl-primary">CarLink</h1>
        <p className="text-sm text-cl-gray-600 mt-1">سوق السيارات الخليجي</p>
      </div>
      <div className="cl-card">
        <h2 className="text-lg font-semibold mb-5">{t('login')}</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="cl-label">{t('email')}</label>
          <input
            type="email"
            className="cl-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="cl-label">{t('password')}</label>
          <input
            type="password"
            className="cl-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-cl-danger">{error}</p>}

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? tc('loading') : t('login')}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <span className="h-px flex-1 bg-cl-gray-200" />
        <span className="text-xs text-cl-gray-400">{tc('or')}</span>
        <span className="h-px flex-1 bg-cl-gray-200" />
      </div>

      <NafathButton />

      <p className="text-sm text-center text-cl-gray-600 mt-6">
        {t('noAccount')}{' '}
        <Link href={`/${locale}/register`} className="text-cl-primary font-medium">
          {t('createAccount')}
        </Link>
      </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Shield } from 'lucide-react'

export const metadata = undefined // client component

export default function AdminLoginPage() {
  const locale = useLocale()
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (res?.error) {
      setError('بيانات الدخول غير صحيحة')
      return
    }

    const { getSession } = await import('next-auth/react')
    const session = await getSession()

    if (session?.user?.role !== 'PLATFORM_ADMIN') {
      setError('هذه الصفحة مخصصة لمدير المنصة فقط')
      await import('next-auth/react').then(m => m.signOut({ redirect: false }))
      return
    }

    router.push(`/${locale}/admin`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0F3460] mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">لوحة تحكم المنصة</h1>
          <p className="text-sm text-gray-500 mt-1">CarSell Admin</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3460]/20 focus:border-[#0F3460]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@carsell.one"
                required
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                كلمة المرور
              </label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3460]/20 focus:border-[#0F3460]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F3460] text-white font-medium py-2.5 rounded-xl text-sm hover:bg-[#0a2547] transition-colors disabled:opacity-60"
            >
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          CarSell Platform · مخصص لمديري المنصة فقط
        </p>
      </div>
    </div>
  )
}

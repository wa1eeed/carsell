'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatNumber } from '@/lib/format'

export function Pagination({ total, page, pageSize }: { total: number; page: number; pageSize: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const locale = useLocale()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  function goto(p: number) {
    const next = new URLSearchParams(params.toString())
    next.set('page', String(p))
    router.push(`${pathname}?${next.toString()}`)
  }

  // RTL: "previous" advances visually; use logical chevrons
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => goto(page - 1)}
        className="flex items-center gap-1 rounded-input border border-cl-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
      <span className="text-sm text-cl-gray-600">
        {formatNumber(page, locale)} / {formatNumber(totalPages, locale)}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => goto(page + 1)}
        className="flex items-center gap-1 rounded-input border border-cl-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>
    </div>
  )
}

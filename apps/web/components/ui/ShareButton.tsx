'use client'

/**
 * ShareButton — shares a car's public URL via native share or copy-to-clipboard.
 * Works from:
 *   - Dealer dashboard car detail page
 *   - Public showroom landing page
 *   - CarSell Live marketplace
 */

import { useState } from 'react'
import { Share2, Check, Copy, MessageCircle, ExternalLink } from 'lucide-react'

interface Props {
  carId:      string
  carTitle:   string
  price?:     string
  showroomSlug?: string | null
  /** Where to generate the share URL from */
  source:     'dashboard' | 'showroom' | 'market'
  locale?:    string
  className?: string
  compact?:   boolean
}

export function ShareButton({ carId, carTitle, price, showroomSlug, source, locale = 'ar', className = '', compact = false }: Props) {
  const [copied,   setCopied]   = useState(false)
  const [open,     setOpen]     = useState(false)

  function buildUrl(): string {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://carlink.sa'
    switch (source) {
      case 'market':   return `${base}/${locale}/market/cars/${carId}`
      case 'showroom':
        // Pretty root-level URL when slug is known: carlink.sa/{slug}/cars/{id}
        return showroomSlug
          ? `${base}/${showroomSlug}/cars/${carId}`
          : `${base}/${locale}/market/cars/${carId}`
      case 'dashboard':
        // Share to the public market page (most useful from dashboard)
        return `${base}/${locale}/market/cars/${carId}`
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(buildUrl()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
    setOpen(false)
  }

  function nativeShare() {
    navigator.share({
      title: carTitle,
      text:  price ? `${carTitle} — السعر: ${price} ريال` : carTitle,
      url:   buildUrl(),
    }).catch(() => {})
    setOpen(false)
  }

  function whatsappShare() {
    const text = encodeURIComponent(`${carTitle}\n${price ? `السعر: ${price} ريال\n` : ''}${buildUrl()}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setOpen(false)
  }

  if (compact) {
    return (
      <button
        onClick={() => {
          if (typeof (navigator as { share?: unknown }).share === 'function') nativeShare()
          else copyLink()
        }}
        title="مشاركة"
        className={`p-2 rounded-[6px] border border-gray-200 text-gray-400 hover:text-[#0F3460] hover:border-[#0F3460] transition-colors ${className}`}
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
      </button>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-[8px] text-sm text-gray-600 hover:border-[#0F3460] hover:text-[#0F3460] transition-colors"
      >
        <Share2 size={14} />
        مشاركة
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-[10px] shadow-lg z-50 w-48 py-1 overflow-hidden" dir="rtl">
            {typeof navigator !== 'undefined' && typeof (navigator as { share?: unknown }).share === 'function' && (
              <button
                onClick={nativeShare}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full"
              >
                <Share2 size={14} className="text-[#0F3460]" />
                مشاركة...
              </button>
            )}
            <button
              onClick={whatsappShare}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full"
            >
              <MessageCircle size={14} className="text-green-500" />
              مشاركة عبر واتساب
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full"
            >
              {copied
                ? <><Check size={14} className="text-green-500" /> تم النسخ!</>
                : <><Copy size={14} className="text-gray-400" /> نسخ الرابط</>}
            </button>
            <div className="border-t border-gray-50 mt-1 pt-1">
              <a
                href={buildUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full"
                onClick={() => setOpen(false)}
              >
                <ExternalLink size={14} className="text-gray-400" />
                فتح الصفحة العامة
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

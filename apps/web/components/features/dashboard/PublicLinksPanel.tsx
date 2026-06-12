'use client'

import { ExternalLink, Store, Globe, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useOrigin } from '@/lib/hooks/use-origin'
import { useTranslations } from 'next-intl'

interface Props {
  showroomSlug:   string | null
  showroomName:   string
  locale?:        string
}

export function PublicLinksPanel({ showroomSlug, showroomName, locale = 'ar' }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const t = useTranslations('publicLinks')

  // Showroom public URL — pretty root-level path: carsell.one/{slug}
  const origin = useOrigin()
  const showroomDirectUrl = showroomSlug ? `${origin}/${showroomSlug}` : null
  const marketUrl         = `${origin}/market`

  function copy(url: string, key: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-5" dir="rtl">
      <h2 className="font-bold text-[#0F3460] mb-4 flex items-center gap-2">
        <Globe size={16} />
        {t('title')}
      </h2>

      <div className="space-y-3">
        {/* Showroom landing page */}
        <div className="border border-gray-100 rounded-[8px] p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-[#0F3460]/10 rounded-[6px] flex items-center justify-center">
              <Store size={14} className="text-[#0F3460]" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">{t('showroomPage')}</div>
              <div className="text-xs text-gray-400">{t('showroomDesc')}</div>
            </div>
          </div>

          {showroomSlug ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 bg-gray-50 rounded-[6px] px-2.5 py-1.5">
                <span className="text-xs text-gray-500 flex-1 truncate ltr font-mono">
                  carsell.one/{showroomSlug}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copy(showroomDirectUrl!, 'direct')}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                    title={t('copyLink')}
                  >
                    {copied === 'direct' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                  <a
                    href={showroomDirectUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-[#0F3460]"
                    title={t('openPage')}
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-[6px]">
              {t('noSlug')}
            </div>
          )}
        </div>

        {/* CarSell Live */}
        <div className="border border-gray-100 rounded-[8px] p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-[#C9A84C]/15 rounded-[6px] flex items-center justify-center">
              <Globe size={14} className="text-[#C9A84C]" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">CarSell Live</div>
              <div className="text-xs text-gray-400">{t('marketDesc')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#C9A84C]/5 rounded-[6px] px-2.5 py-1.5">
            <span className="text-xs text-[#C9A84C]/80 flex-1 truncate ltr font-mono">
              carsell.one/market
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => copy(marketUrl, 'market')}
                className="p-1 rounded text-[#C9A84C]/60 hover:text-[#C9A84C]"
              >
                {copied === 'market' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              </button>
              <a
                href={marketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-[#C9A84C]/60 hover:text-[#C9A84C]"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 leading-relaxed">
        {t('hint')}
      </p>
    </div>
  )
}

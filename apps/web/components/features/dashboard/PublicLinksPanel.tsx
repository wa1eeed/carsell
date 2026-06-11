'use client'

/**
 * PublicLinksPanel — shown on the dashboard homepage.
 * Gives the dealer quick access to their two public-facing URLs:
 *   1. Their own showroom landing page
 *   2. CarSell Live (platform-wide public marketplace)
 */

import { ExternalLink, Store, Globe, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useOrigin } from '@/lib/hooks/use-origin'

interface Props {
  showroomSlug:   string | null
  showroomName:   string
  locale?:        string
}

export function PublicLinksPanel({ showroomSlug, showroomName, locale = 'ar' }: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  // Showroom public URL — pretty root-level path: carlink.sa/{slug}
  const origin = useOrigin()
  const showroomDirectUrl    = showroomSlug ? `${origin}/${showroomSlug}` : null
  const showroomSubdomainUrl = showroomSlug ? `https://${showroomSlug}.carlink.sa` : null
  const marketUrl            = `${origin}/${locale}/market`

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
        صفحاتك العامة
      </h2>

      <div className="space-y-3">
        {/* Showroom landing page */}
        <div className="border border-gray-100 rounded-[8px] p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-[#0F3460]/10 rounded-[6px] flex items-center justify-center">
              <Store size={14} className="text-[#0F3460]" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">صفحة معرضك</div>
              <div className="text-xs text-gray-400">كتالوج عام لسياراتك فقط</div>
            </div>
          </div>

          {showroomSlug ? (
            <div className="space-y-1.5">
              {/* Direct URL (always works) */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-[6px] px-2.5 py-1.5">
                <span className="text-xs text-gray-500 flex-1 truncate ltr font-mono">
                  carlink.sa/{showroomSlug}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copy(showroomDirectUrl!, 'direct')}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                    title="نسخ الرابط"
                  >
                    {copied === 'direct' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                  <a
                    href={showroomDirectUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-[#0F3460]"
                    title="فتح الصفحة"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Subdomain (production) */}
              <div className="flex items-center gap-2 bg-[#0F3460]/5 rounded-[6px] px-2.5 py-1.5">
                <span className="text-xs text-[#0F3460]/70 flex-1 truncate ltr font-mono">
                  {showroomSlug}.carlink.sa
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copy(showroomSubdomainUrl!, 'subdomain')}
                    className="p-1 hover:bg-[#0F3460]/10 rounded text-[#0F3460]/50 hover:text-[#0F3460]"
                    title="نسخ الرابط"
                  >
                    {copied === 'subdomain' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                  <span className="text-[9px] bg-[#0F3460]/10 text-[#0F3460]/60 px-1.5 py-0.5 rounded-full font-medium">
                    PROD
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-[6px]">
              أضف slug للمعرض من الإعدادات لتفعيل الرابط المخصص
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
              <div className="text-xs text-gray-400">سوق عام — كل السيارات من كل المعارض</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#C9A84C]/5 rounded-[6px] px-2.5 py-1.5">
            <span className="text-xs text-[#C9A84C]/80 flex-1 truncate ltr font-mono">
              carlink.sa/market
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
        💡 عند نشر سيارة، اختر أين تريد عرضها: صفحة معرضك فقط أو CarSell Live أو كليهما.
      </p>
    </div>
  )
}

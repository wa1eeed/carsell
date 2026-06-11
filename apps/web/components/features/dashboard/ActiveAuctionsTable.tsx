'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Gavel } from 'lucide-react'
import { Price } from '@/components/ui/Price'

interface Auction {
  id: string
  title: string
  topBid: number
  status: 'active'
  endsAt?: string
}

function Countdown({ endsAt }: { endsAt?: string }) {
  const [label, setLabel] = useState('—')

  useEffect(() => {
    if (!endsAt) return
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) {
        setLabel('00:00:00')
        return
      }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1000)
      setLabel(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return <span className="price-number text-cl-gray-800">{label}</span>
}

export function ActiveAuctionsTable({ auctions }: { auctions: Auction[] }) {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  return (
    <section className="cl-card !p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4">
        <Gavel size={18} className="text-cl-primary" />
        <h2 className="font-semibold">{t('activeAuctions')}</h2>
      </div>

      {auctions.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-cl-gray-400">{tc('noData')}</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="cl-table">
          <thead>
            <tr>
              <th className="text-start">{t('recentCars')}</th>
              <th className="text-start">{t('topBid')}</th>
              <th className="text-start">{t('endsIn')}</th>
              <th className="text-start">{tc('status')}</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td><Price value={a.topBid} size="sm" /></td>
                <td><Countdown endsAt={a.endsAt} /></td>
                <td><span className="badge badge-auction">{t('activeAuctions')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  )
}

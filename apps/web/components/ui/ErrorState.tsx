'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle, RotateCw } from 'lucide-react'

export function ErrorState({ reset }: { reset: () => void }) {
  const tc = useTranslations('common')
  return (
    <div className="cl-card max-w-md mx-auto my-12 text-center space-y-4 py-10">
      <AlertCircle size={40} className="mx-auto text-cl-danger" />
      <p className="font-medium">{tc('error')}</p>
      <button className="btn-primary mx-auto" onClick={reset}>
        <RotateCw size={16} /> {tc('confirm')}
      </button>
    </div>
  )
}

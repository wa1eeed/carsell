'use client'

import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 end-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
          variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'
        )}>
          <AlertTriangle
            size={22}
            className={variant === 'danger' ? 'text-red-500' : 'text-amber-500'}
          />
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm',
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-amber-500 hover:bg-amber-600'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

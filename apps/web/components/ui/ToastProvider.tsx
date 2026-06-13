'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '10px',
          background: '#0F172A',
          color: '#F8FAFC',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          maxWidth: '380px',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  )
}

'use client'

import { MessageCircle, MapPin, Instagram, Phone, Star, ChevronRight } from 'lucide-react'
import { buildWhatsappLink } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

export interface ShowroomInfo {
  name: string
  city: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  tagline: string | null
  whatsapp: string | null
  phone: string | null
  instagramUrl: string | null
}

export function ShowroomHeader({ showroom }: { showroom: ShowroomInfo }) {
  const wa = buildWhatsappLink(showroom.whatsapp, `مرحباً، أرغب بالاستفسار عن سياراتكم`)

  return (
    <header className="relative bg-cl-primary overflow-hidden">
      {/* Cover image or gradient background */}
      {showroom.coverImageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showroom.coverImageUrl}
            alt={showroom.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </>
      ) : (
        <div className="absolute inset-0">
          <div className="absolute -top-20 -end-20 w-96 h-96 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute bottom-0 -start-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="sgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sgrid)" />
          </svg>
        </div>
      )}

      <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Logo */}
          <div className={cn(
            'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-2xl border-2',
            showroom.coverImageUrl ? 'border-white/30' : 'border-white/20 bg-white/10'
          )}>
            {showroom.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={showroom.logoUrl} alt={showroom.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-cl-accent/20">
                <span className="text-white font-bold text-3xl">{showroom.name.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-start">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1 mb-3">
              <Star size={11} className="text-green-400 fill-green-400" />
              <span className="text-green-300 text-xs font-medium">معرض موثّق</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 truncate">{showroom.name}</h1>

            {showroom.tagline && (
              <p className="text-white/70 text-sm mb-2 truncate">{showroom.tagline}</p>
            )}

            {showroom.city && (
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-white/50 text-sm">
                <MapPin size={14} />
                <span>{showroom.city}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 shrink-0">
            {showroom.instagramUrl && (
              <a
                href={showroom.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all backdrop-blur-sm"
              >
                <Instagram size={16} />
              </a>
            )}
            {showroom.phone && (
              <a
                href={`tel:${showroom.phone}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all backdrop-blur-sm"
              >
                <Phone size={16} />
                <span className="hidden sm:inline ltr">{showroom.phone}</span>
              </a>
            )}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5c] text-white text-sm font-semibold transition-all shadow-lg shadow-[#25D366]/25"
              >
                <MessageCircle size={16} />
                WhatsApp
                <ChevronRight size={14} className="opacity-60" />
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

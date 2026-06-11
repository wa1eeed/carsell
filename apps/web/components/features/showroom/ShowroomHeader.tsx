'use client'

import { MessageCircle, MapPin, Instagram, Phone } from 'lucide-react'
import { buildWhatsappLink } from '@/lib/whatsapp'

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
    <header className="bg-white border-b border-cl-gray-200">
      {showroom.coverImageUrl && (
        <div className="h-40 w-full bg-cl-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={showroom.coverImageUrl} alt={showroom.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center gap-4">
        <div className="h-16 w-16 rounded-card bg-cl-gray-100 overflow-hidden flex items-center justify-center shrink-0">
          {showroom.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={showroom.logoUrl} alt={showroom.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-cl-primary font-bold text-xl">{showroom.name.charAt(0)}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-cl-primary truncate">{showroom.name}</h1>
          {showroom.tagline && <p className="text-sm text-cl-gray-600 truncate">{showroom.tagline}</p>}
          {showroom.city && (
            <p className="flex items-center gap-1 text-xs text-cl-gray-400 mt-1">
              <MapPin size={12} /> {showroom.city}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showroom.instagramUrl && (
            <a href={showroom.instagramUrl} target="_blank" rel="noreferrer" className="btn-secondary !px-3">
              <Instagram size={16} />
            </a>
          )}
          {showroom.phone && (
            <a href={`tel:${showroom.phone}`} className="btn-secondary !px-3">
              <Phone size={16} />
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="btn-gold">
              <MessageCircle size={16} /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

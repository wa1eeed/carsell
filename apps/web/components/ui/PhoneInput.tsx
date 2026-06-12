'use client'

/**
 * PhoneInput — international phone field with two parts:
 *   1. Country dial-code dropdown (searchable, flag + name + +code)
 *   2. National number input (without leading zero)
 *
 * Emits the combined E.164 value (e.g. +966501234567) via onChange.
 * Default country: Saudi Arabia (or derived from `defaultIso`).
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import {
  COUNTRIES, DEFAULT_COUNTRY, flagEmoji, buildE164, parsePhone,
  type Country,
} from '@/lib/countries'

interface Props {
  /** Stored value (E.164 or legacy local). Used to initialise both parts. */
  value?:       string
  onChange:     (e164: string) => void
  defaultIso?:  string
  required?:    boolean
  placeholder?: string
  className?:   string
}

export function PhoneInput({ value, onChange, defaultIso, required, placeholder, className = '' }: Props) {
  const initial = useMemo(() => parsePhone(value), [])  // parse once on mount
  const [country, setCountry]   = useState<Country>(
    defaultIso ? (COUNTRIES.find((c) => c.iso === defaultIso.toUpperCase()) ?? initial.country) : initial.country,
  )
  const [national, setNational] = useState(initial.national)
  const [open, setOpen]         = useState(false)
  const [query, setQuery]       = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  // Emit combined value whenever either part changes
  useEffect(() => {
    onChange(national ? buildE164(country, national) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, national])

  // Close dropdown on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(
      (c) =>
        c.nameAr.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex" dir="ltr">
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 border border-gray-200 rounded-l-[8px] bg-gray-50 hover:bg-gray-100 transition-colors shrink-0"
        >
          <span className="text-base leading-none">{flagEmoji(country.iso)}</span>
          <span className="text-sm font-mono text-gray-700">+{country.dial}</span>
          <ChevronDown size={13} className="text-gray-400" />
        </button>

        {/* National number (no leading zero) */}
        <input
          type="tel"
          inputMode="numeric"
          dir="ltr"
          value={national}
          onChange={(e) => setNational(e.target.value.replace(/[^\d]/g, '').replace(/^0+/, ''))}
          placeholder={placeholder ?? '5XXXXXXXX'}
          required={required}
          className="flex-1 border border-l-0 border-gray-200 rounded-r-[8px] px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-[10px] shadow-lg overflow-hidden" dir="ltr">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن دولة..."
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-[6px] focus:outline-none"
              />
            </div>
          </div>
          {/* List */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.iso + c.dial}
                type="button"
                onClick={() => { setCountry(c); setOpen(false); setQuery('') }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left ${
                  c.iso === country.iso ? 'bg-[#0F3460]/5' : ''
                }`}
              >
                <span className="text-base leading-none">{flagEmoji(c.iso)}</span>
                <span className="flex-1 text-gray-700" dir="rtl">{c.nameAr}</span>
                <span className="text-gray-400 font-mono text-xs">+{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-400">لا توجد نتائج</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

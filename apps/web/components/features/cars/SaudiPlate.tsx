'use client'

import {
  SAUDI_PLATE_LETTERS,
  PLATE_TYPE_COLORS,
  lettersToEn,
  toArabicDigits,
  type SaudiPlateType,
} from '@/lib/saudi-plate'

interface SaudiPlateProps {
  letters: string[]
  numbers: string
  type?: SaudiPlateType
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onLettersChange?: (letters: string[]) => void
  onNumbersChange?: (numbers: string) => void
}

const SIZES = {
  sm: { w: 200, h: 64, font: 18 },
  md: { w: 280, h: 88, font: 26 },
  lg: { w: 360, h: 108, font: 34 },
}

/**
 * Saudi license plate — 3 columns: numbers | KSA strip | letters (RTL).
 * Each column shows Arabic (top) + Latin (bottom). Strip color = plate type.
 */
export function SaudiPlate({
  letters,
  numbers,
  type = 'PRIVATE',
  size = 'lg',
  interactive = false,
  onLettersChange,
  onNumbersChange,
}: SaudiPlateProps) {
  const dims = SIZES[size]
  const colors = PLATE_TYPE_COLORS[type]
  const lettersEn = lettersToEn(letters)
  // Display reversed (RTL → LTR) per spec
  const lettersEnDisplay = [...lettersEn].reverse()

  if (interactive) {
    return (
      <div className="space-y-3">
        <div
          className="grid grid-cols-[1fr_auto_1fr] items-stretch rounded-lg overflow-hidden mx-auto"
          style={{ width: dims.w, height: dims.h, border: `3px solid ${colors.border}`, background: colors.bg }}
          dir="ltr"
        >
          <PlateCell main={toArabicDigits(numbers) || '—'} sub={numbers || '—'} font={dims.font} color={colors.fg} />
          <KsaStrip colors={colors} />
          <PlateCell
            main={letters.join(' ') || '—'}
            sub={lettersEnDisplay.join(' ') || '—'}
            font={dims.font}
            color={colors.fg}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="cl-label">الحروف</label>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <select
                  key={i}
                  className="cl-input"
                  value={letters[i] ?? ''}
                  onChange={(e) => {
                    const next = [...letters]
                    if (e.target.value) next[i] = e.target.value
                    else next.splice(i, 1)
                    onLettersChange?.(next.filter(Boolean))
                  }}
                >
                  <option value="">{i === 0 ? '—' : '∅'}</option>
                  {SAUDI_PLATE_LETTERS.map((l) => (
                    <option key={l.ar} value={l.ar}>
                      {l.ar} ({l.en})
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
          <div>
            <label className="cl-label">الأرقام</label>
            <input
              className="cl-input plate-number"
              inputMode="numeric"
              maxLength={4}
              value={numbers}
              onChange={(e) => onNumbersChange?.(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-[1fr_auto_1fr] items-stretch rounded-lg overflow-hidden"
      style={{ width: dims.w, height: dims.h, border: `3px solid ${colors.border}`, background: colors.bg }}
      dir="ltr"
    >
      <PlateCell main={toArabicDigits(numbers)} sub={numbers} font={dims.font} color={colors.fg} />
      <KsaStrip colors={colors} />
      <PlateCell main={letters.join(' ')} sub={lettersEnDisplay.join(' ')} font={dims.font} color={colors.fg} />
    </div>
  )
}

function PlateCell({ main, sub, font, color }: { main: string; sub: string; font: number; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center font-mono" style={{ color }}>
      <span style={{ fontSize: font, lineHeight: 1.1 }}>{main}</span>
      <span style={{ fontSize: font * 0.55, lineHeight: 1.1, opacity: 0.85 }}>{sub}</span>
    </div>
  )
}

function KsaStrip({ colors }: { colors: { border: string; fg: string } }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-2 border-x"
      style={{ borderColor: colors.border, minWidth: 56 }}
    >
      <span className="text-[10px] font-semibold" style={{ color: colors.fg }}>
        🇸🇦
      </span>
      <span className="text-xs font-bold" style={{ color: colors.fg }}>
        KSA
      </span>
      <span className="text-[9px]" style={{ color: colors.fg }}>
        السعودية
      </span>
    </div>
  )
}

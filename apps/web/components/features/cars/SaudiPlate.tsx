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
  sm: { w: 200, h: 64,  font: 15, subFont: 8,  stripW: 40 },
  md: { w: 280, h: 88,  font: 22, subFont: 11, stripW: 54 },
  lg: { w: 360, h: 108, font: 28, subFont: 14, stripW: 66 },
}

export function SaudiPlate({
  letters,
  numbers,
  type = 'PRIVATE',
  size = 'lg',
  interactive = false,
  onLettersChange,
  onNumbersChange,
}: SaudiPlateProps) {
  const dims   = SIZES[size]
  const colors = PLATE_TYPE_COLORS[type]
  const lettersEn = lettersToEn(letters)
  // Arabic is displayed RTL (reversed) → English matches
  const lettersArDisplay = [...letters].reverse()
  const lettersEnDisplay = [...lettersEn].reverse()
  const numsAr = toArabicDigits(numbers) || '—'
  const numsEn = numbers || '—'
  // Split digits so each pair sits in its own column (same as letters)
  const numDigitsAr = numsAr.split('')
  const numDigitsEn = numsEn.split('')

  const plate = (
    <div
      className="grid items-stretch rounded-lg overflow-hidden"
      style={{
        width: dims.w,
        height: dims.h,
        border: `3px solid ${colors.border}`,
        background: colors.bg,
        gridTemplateColumns: `1fr ${dims.stripW}px 1fr`,
      }}
      dir="ltr"
    >
      {/* Left: Numbers — digits stacked Arabic/English */}
      <div className="flex items-center justify-center gap-[3px] px-1">
        {numDigitsAr.map((_, i) => (
          <CharStack
            key={i}
            ar={numDigitsAr[i]}
            en={numDigitsEn[i]}
            font={dims.font}
            subFont={dims.subFont}
            color={colors.fg}
            isNum
          />
        ))}
      </div>

      {/* Center: KSA strip */}
      <KsaStrip colors={colors} size={size} />

      {/* Right: Letters — each letter stacked Arabic/English */}
      <div className="flex items-center justify-center gap-[3px] px-1">
        {lettersArDisplay.length > 0 ? (
          lettersArDisplay.map((ar, i) => (
            <CharStack
              key={i}
              ar={ar}
              en={lettersEnDisplay[i] ?? ''}
              font={dims.font}
              subFont={dims.subFont}
              color={colors.fg}
            />
          ))
        ) : (
          <CharStack ar="—" en="—" font={dims.font} subFont={dims.subFont} color={colors.fg} />
        )}
      </div>
    </div>
  )

  if (!interactive) return plate

  return (
    <div className="space-y-3">
      {plate}
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

/** Single character column: Arabic (top) over English (bottom), perfectly aligned */
function CharStack({
  ar, en, font, subFont, color, isNum = false,
}: {
  ar: string; en: string; font: number; subFont: number; color: string; isNum?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minWidth: font * 0.75 }}>
      <span
        style={{
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          fontSize: font,
          lineHeight: 1.05,
          color,
          // numbers are always LTR
          direction: isNum ? 'ltr' : 'rtl',
        }}
      >
        {ar}
      </span>
      <span
        style={{
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          fontSize: subFont,
          lineHeight: 1.05,
          color,
          opacity: 0.82,
          direction: 'ltr',
        }}
      >
        {en}
      </span>
    </div>
  )
}

function KsaStrip({ colors, size }: { colors: { border: string; fg: string }; size: 'sm' | 'md' | 'lg' }) {
  const emblemSize = size === 'sm' ? 18 : size === 'md' ? 26 : 32
  const ksaFontSize = size === 'sm' ? 7 : size === 'md' ? 9 : 11
  return (
    <div
      className="flex flex-col items-center justify-center border-x"
      style={{ borderColor: colors.border }}
    >
      <PalmSwordsEmblem size={emblemSize} color={colors.fg} />
      <span
        style={{
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          fontSize: ksaFontSize,
          color: colors.fg,
          letterSpacing: '0.04em',
          marginTop: 1,
        }}
      >
        KSA
      </span>
    </div>
  )
}

/** Saudi emblem: palm tree + two crossed swords, rendered as inline SVG */
function PalmSwordsEmblem({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Palm trunk */}
      <rect x="47" y="28" width="6" height="42" rx="2" />

      {/* Palm fronds */}
      <path d="M50 28 C50 28 30 22 24 10 C30 14 42 20 50 28Z" />
      <path d="M50 28 C50 28 70 22 76 10 C70 14 58 20 50 28Z" />
      <path d="M50 28 C50 28 20 30 12 20 C20 22 40 24 50 28Z" />
      <path d="M50 28 C50 28 80 30 88 20 C80 22 60 24 50 28Z" />
      <path d="M50 28 C50 28 26 38 16 32 C24 32 42 30 50 28Z" />
      <path d="M50 28 C50 28 74 38 84 32 C76 32 58 30 50 28Z" />

      {/* Left sword */}
      <path d="M8 80 L46 55 L48 58 L10 83 Z" />
      {/* Left sword guard */}
      <ellipse cx="10" cy="81" rx="5" ry="2.5" transform="rotate(-32 10 81)" />
      {/* Left sword pommel */}
      <circle cx="6" cy="83" r="3" />

      {/* Right sword */}
      <path d="M92 80 L54 55 L52 58 L90 83 Z" />
      {/* Right sword guard */}
      <ellipse cx="90" cy="81" rx="5" ry="2.5" transform="rotate(32 90 81)" />
      {/* Right sword pommel */}
      <circle cx="94" cy="83" r="3" />
    </svg>
  )
}

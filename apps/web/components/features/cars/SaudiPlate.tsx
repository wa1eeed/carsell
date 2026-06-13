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

/** Saudi emblem: palm tree + two crossed curved swords, traced to match the official emblem */
function PalmSwordsEmblem({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.08)}
      viewBox="0 0 200 216"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── TRUNK ── */}
      <path d="M96 42 C95 70 94 105 94 152 L106 152 C106 105 105 70 104 42 Z" />

      {/* ── PALM FRONDS ──
          Each frond is a filled leaf-shape: starts at crown, widens slightly, tapers to tip.
          Left side (6 fronds), Right side (mirror, 6 fronds), plus one top frond. */}

      {/* Top frond — straight up */}
      <path d="M100 4 C98 10 97 26 98 38 L102 38 C103 26 102 10 100 4 Z" />

      {/* Upper-left fronds (steep angles) */}
      <path d="M99 18 C88 12 68  6 52  2 C62  8 86 16 100 24 Z" />
      <path d="M99 22 C84 18 60 14 42 12 C56 16 84 22 100 27 Z" />

      {/* Mid-left fronds (shallow angles) */}
      <path d="M98 28 C82 26 58 26 38 28 C54 26 82 28 100 31 Z" />
      <path d="M98 33 C82 36 58 42 38 48 C56 42 82 35 100 33 Z" />

      {/* Lower-left frond (drooping) */}
      <path d="M98 38 C86 46 68 60 54 72 C66 60 86 46 100 38 Z" />

      {/* Upper-right fronds */}
      <path d="M101 18 C112 12 132  6 148  2 C138  8 114 16 100 24 Z" />
      <path d="M101 22 C116 18 140 14 158 12 C144 16 116 22 100 27 Z" />

      {/* Mid-right fronds */}
      <path d="M102 28 C118 26 142 26 162 28 C146 26 118 28 100 31 Z" />
      <path d="M102 33 C118 36 142 42 162 48 C144 42 118 35 100 33 Z" />

      {/* Lower-right frond (drooping) */}
      <path d="M102 38 C114 46 132 60 146 72 C134 60 114 46 100 38 Z" />

      {/* ── LEFT SWORD ──
          Blade: curved scimitar sweeping from far-left tip to the crossing point at trunk base.
          The blade has a distinct curved belly. */}
      <path d="
        M 6 144
        C 30 136 62 136 93 150
        L 95 158
        C 62 146 28 148  8 150
        Z
      " />

      {/* Left sword — handle assembly (guard → grip → pommel) */}
      {/* Grip */}
      <path d="M93 150 L95 158 L89 174 L86 167 Z" />
      {/* Guard (oval crosspiece, angled) */}
      <ellipse cx="88" cy="170" rx="9" ry="3.5" transform="rotate(-28 88 170)" />
      {/* Pommel */}
      <circle cx="83" cy="185" r="7.5" />
      {/* Pommel decoration (small knob at very end) */}
      <circle cx="83" cy="195" r="3" />

      {/* ── RIGHT SWORD (mirror of left) ── */}
      <path d="
        M 194 144
        C 170 136 138 136 107 150
        L 105 158
        C 138 146 172 148 192 150
        Z
      " />

      {/* Right sword — handle assembly */}
      <path d="M107 150 L105 158 L111 174 L114 167 Z" />
      <ellipse cx="112" cy="170" rx="9" ry="3.5" transform="rotate(28 112 170)" />
      <circle cx="117" cy="185" r="7.5" />
      <circle cx="117" cy="195" r="3" />
    </svg>
  )
}

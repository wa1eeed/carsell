/**
 * Saudi plate — official 17-letter table (Traffic Authority).
 * Source: docs/components/saudi-plate.md
 */

export const SAUDI_PLATE_LETTERS: { ar: string; en: string }[] = [
  { ar: 'أ', en: 'A' },
  { ar: 'ب', en: 'B' },
  { ar: 'ح', en: 'J' },
  { ar: 'د', en: 'D' },
  { ar: 'ر', en: 'R' },
  { ar: 'س', en: 'S' },
  { ar: 'ص', en: 'X' },
  { ar: 'ط', en: 'T' },
  { ar: 'ع', en: 'E' },
  { ar: 'ق', en: 'G' },
  { ar: 'ك', en: 'K' },
  { ar: 'ل', en: 'L' },
  { ar: 'م', en: 'Z' },
  { ar: 'ن', en: 'N' },
  { ar: 'هـ', en: 'H' },
  { ar: 'و', en: 'U' },
  { ar: 'ي', en: 'V' },
]

const AR_TO_EN = new Map(SAUDI_PLATE_LETTERS.map((l) => [l.ar, l.en]))

export type SaudiPlateType = 'PRIVATE' | 'TAXI' | 'TRANSPORT' | 'DIPLOMAT'

export const PLATE_TYPE_COLORS: Record<SaudiPlateType, { bg: string; fg: string; border: string }> = {
  PRIVATE:   { bg: '#FFFFFF', fg: '#1E293B', border: '#1E293B' },
  TAXI:      { bg: '#F5C518', fg: '#92400E', border: '#92400E' },
  TRANSPORT: { bg: '#1B3A6B', fg: '#FFFFFF', border: '#1B3A6B' },
  DIPLOMAT:  { bg: '#1565C0', fg: '#FFFFFF', border: '#1565C0' },
}

export function lettersToEn(letters: string[]): string[] {
  return letters.map((l) => AR_TO_EN.get(l) ?? l)
}

/** Western digits → Arabic-Indic for display only. */
export function toArabicDigits(input: string): string {
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return input.replace(/[0-9]/g, (d) => map[Number(d)])
}

/** Build the stored plate string: "ح ن ط 7653" (letters spaced + western digits). */
export function buildPlateNumber(letters: string[], numbers: string): string {
  const ls = letters.filter(Boolean).join(' ')
  return `${ls} ${numbers}`.trim()
}

/** Parse a stored plate string back into letters[] + numbers. */
export function parsePlateNumber(plate?: string | null): { letters: string[]; numbers: string } {
  if (!plate) return { letters: [], numbers: '' }
  const numbers = (plate.match(/\d+/)?.[0]) ?? ''
  const letters = plate
    .replace(/\d+/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return { letters, numbers }
}

/**
 * Country dial codes for the phone input.
 * Gulf + Arab countries first (most relevant), then the rest alphabetically.
 * Flag emoji is derived from the ISO-2 code.
 */

export interface Country {
  iso:    string // ISO-3166 alpha-2
  dial:   string // dial code without +
  nameAr: string
  nameEn: string
  /** expected national-number length (digits after the dial code), for light validation */
  len?:   number
}

/** Regional-indicator flag emoji from ISO-2 code (e.g. "SA" → 🇸🇦) */
export function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
}

// ── Gulf + Arab (top priority) ──────────────────────────────────────────────
const PRIORITY: Country[] = [
  { iso: 'SA', dial: '966', nameAr: 'السعودية',     nameEn: 'Saudi Arabia',        len: 9 },
  { iso: 'AE', dial: '971', nameAr: 'الإمارات',      nameEn: 'United Arab Emirates', len: 9 },
  { iso: 'KW', dial: '965', nameAr: 'الكويت',        nameEn: 'Kuwait',              len: 8 },
  { iso: 'QA', dial: '974', nameAr: 'قطر',           nameEn: 'Qatar',               len: 8 },
  { iso: 'BH', dial: '973', nameAr: 'البحرين',       nameEn: 'Bahrain',             len: 8 },
  { iso: 'OM', dial: '968', nameAr: 'عُمان',         nameEn: 'Oman',                len: 8 },
  { iso: 'YE', dial: '967', nameAr: 'اليمن',         nameEn: 'Yemen' },
  { iso: 'JO', dial: '962', nameAr: 'الأردن',        nameEn: 'Jordan',              len: 9 },
  { iso: 'EG', dial: '20',  nameAr: 'مصر',           nameEn: 'Egypt',               len: 10 },
  { iso: 'IQ', dial: '964', nameAr: 'العراق',        nameEn: 'Iraq' },
  { iso: 'SY', dial: '963', nameAr: 'سوريا',         nameEn: 'Syria' },
  { iso: 'LB', dial: '961', nameAr: 'لبنان',         nameEn: 'Lebanon' },
  { iso: 'PS', dial: '970', nameAr: 'فلسطين',        nameEn: 'Palestine' },
  { iso: 'SD', dial: '249', nameAr: 'السودان',       nameEn: 'Sudan' },
  { iso: 'LY', dial: '218', nameAr: 'ليبيا',         nameEn: 'Libya' },
  { iso: 'TN', dial: '216', nameAr: 'تونس',          nameEn: 'Tunisia' },
  { iso: 'DZ', dial: '213', nameAr: 'الجزائر',       nameEn: 'Algeria' },
  { iso: 'MA', dial: '212', nameAr: 'المغرب',        nameEn: 'Morocco' },
  { iso: 'MR', dial: '222', nameAr: 'موريتانيا',     nameEn: 'Mauritania' },
]

// ── Rest of the world ───────────────────────────────────────────────────────
const REST: Country[] = [
  { iso: 'US', dial: '1',   nameAr: 'الولايات المتحدة', nameEn: 'United States' },
  { iso: 'GB', dial: '44',  nameAr: 'المملكة المتحدة',  nameEn: 'United Kingdom' },
  { iso: 'TR', dial: '90',  nameAr: 'تركيا',            nameEn: 'Turkey' },
  { iso: 'IN', dial: '91',  nameAr: 'الهند',            nameEn: 'India' },
  { iso: 'PK', dial: '92',  nameAr: 'باكستان',          nameEn: 'Pakistan' },
  { iso: 'BD', dial: '880', nameAr: 'بنغلاديش',         nameEn: 'Bangladesh' },
  { iso: 'PH', dial: '63',  nameAr: 'الفلبين',          nameEn: 'Philippines' },
  { iso: 'ID', dial: '62',  nameAr: 'إندونيسيا',        nameEn: 'Indonesia' },
  { iso: 'MY', dial: '60',  nameAr: 'ماليزيا',          nameEn: 'Malaysia' },
  { iso: 'CN', dial: '86',  nameAr: 'الصين',            nameEn: 'China' },
  { iso: 'JP', dial: '81',  nameAr: 'اليابان',          nameEn: 'Japan' },
  { iso: 'KR', dial: '82',  nameAr: 'كوريا الجنوبية',   nameEn: 'South Korea' },
  { iso: 'DE', dial: '49',  nameAr: 'ألمانيا',          nameEn: 'Germany' },
  { iso: 'FR', dial: '33',  nameAr: 'فرنسا',            nameEn: 'France' },
  { iso: 'IT', dial: '39',  nameAr: 'إيطاليا',          nameEn: 'Italy' },
  { iso: 'ES', dial: '34',  nameAr: 'إسبانيا',          nameEn: 'Spain' },
  { iso: 'NL', dial: '31',  nameAr: 'هولندا',           nameEn: 'Netherlands' },
  { iso: 'CH', dial: '41',  nameAr: 'سويسرا',           nameEn: 'Switzerland' },
  { iso: 'SE', dial: '46',  nameAr: 'السويد',           nameEn: 'Sweden' },
  { iso: 'RU', dial: '7',   nameAr: 'روسيا',            nameEn: 'Russia' },
  { iso: 'CA', dial: '1',   nameAr: 'كندا',             nameEn: 'Canada' },
  { iso: 'AU', dial: '61',  nameAr: 'أستراليا',         nameEn: 'Australia' },
  { iso: 'BR', dial: '55',  nameAr: 'البرازيل',         nameEn: 'Brazil' },
  { iso: 'ZA', dial: '27',  nameAr: 'جنوب أفريقيا',     nameEn: 'South Africa' },
  { iso: 'NG', dial: '234', nameAr: 'نيجيريا',          nameEn: 'Nigeria' },
  { iso: 'KE', dial: '254', nameAr: 'كينيا',            nameEn: 'Kenya' },
  { iso: 'ET', dial: '251', nameAr: 'إثيوبيا',          nameEn: 'Ethiopia' },
  { iso: 'AF', dial: '93',  nameAr: 'أفغانستان',        nameEn: 'Afghanistan' },
  { iso: 'IR', dial: '98',  nameAr: 'إيران',            nameEn: 'Iran' },
  { iso: 'LK', dial: '94',  nameAr: 'سريلانكا',         nameEn: 'Sri Lanka' },
  { iso: 'NP', dial: '977', nameAr: 'نيبال',            nameEn: 'Nepal' },
  { iso: 'TH', dial: '66',  nameAr: 'تايلاند',          nameEn: 'Thailand' },
  { iso: 'SG', dial: '65',  nameAr: 'سنغافورة',         nameEn: 'Singapore' },
  { iso: 'GR', dial: '30',  nameAr: 'اليونان',          nameEn: 'Greece' },
  { iso: 'PL', dial: '48',  nameAr: 'بولندا',           nameEn: 'Poland' },
  { iso: 'UA', dial: '380', nameAr: 'أوكرانيا',         nameEn: 'Ukraine' },
  { iso: 'AZ', dial: '994', nameAr: 'أذربيجان',         nameEn: 'Azerbaijan' },
  { iso: 'KZ', dial: '7',   nameAr: 'كازاخستان',        nameEn: 'Kazakhstan' },
]

export const COUNTRIES: Country[] = [...PRIORITY, ...REST]

export const DEFAULT_COUNTRY: Country = PRIORITY[0] // Saudi Arabia

export function findCountryByDial(dial: string): Country | undefined {
  return COUNTRIES.find((c) => c.dial === dial)
}

export function findCountryByIso(iso: string): Country | undefined {
  return COUNTRIES.find((c) => c.iso === iso.toUpperCase())
}

/**
 * Parse a stored E.164-ish phone (e.g. "+966501234567" or "966501234567")
 * into { country, national }. Falls back to default country.
 */
export function parsePhone(stored: string | null | undefined): { country: Country; national: string } {
  if (!stored) return { country: DEFAULT_COUNTRY, national: '' }
  let digits = stored.replace(/[^\d]/g, '').replace(/^00/, '')
  // try the longest matching dial code first
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) {
      return { country: c, national: digits.slice(c.dial.length) }
    }
  }
  // legacy local format like 05XXXXXXXX → strip leading 0, assume Saudi
  if (digits.startsWith('0')) digits = digits.slice(1)
  return { country: DEFAULT_COUNTRY, national: digits }
}

/** Build E.164: +<dial><national> (national with no leading zero) */
export function buildE164(country: Country, national: string): string {
  const n = national.replace(/[^\d]/g, '').replace(/^0+/, '')
  return `+${country.dial}${n}`
}

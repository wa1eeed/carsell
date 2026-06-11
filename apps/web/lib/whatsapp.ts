/**
 * Build a wa.me link from a Saudi phone number (05XXXXXXXX or +9665XXXXXXXX).
 */
export function buildWhatsappLink(phone: string | null | undefined, text?: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  let intl = digits
  if (digits.startsWith('05')) intl = `966${digits.slice(1)}`
  else if (digits.startsWith('5') && digits.length === 9) intl = `966${digits}`
  else if (digits.startsWith('966')) intl = digits
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${intl}${q}`
}

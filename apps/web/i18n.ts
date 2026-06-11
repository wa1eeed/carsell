import { getRequestConfig } from 'next-intl/server'
import { LOCALES, DEFAULT_LOCALE } from '@/lib/constants'

export default getRequestConfig(async ({ locale }) => {
  const resolved = (LOCALES as readonly string[]).includes(locale) ? locale : DEFAULT_LOCALE
  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default,
  }
})

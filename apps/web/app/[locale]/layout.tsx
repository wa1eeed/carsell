import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { SessionProvider } from '@/components/providers/SessionProvider'
import '../globals.css'

export const metadata: Metadata = {
  title: 'CarLink — سوق السيارات الخليجي',
  description: 'منصة إدارة معارض السيارات في السعودية والخليج',
}

type Props = {
  children: React.ReactNode
  params: { locale: string }
}

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  const messages = await getMessages()

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>{children}</SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

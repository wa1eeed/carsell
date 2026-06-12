import { Metadata } from 'next'
import { LandingNavbar } from '@/components/features/landing/LandingNavbar'
import { HeroSection } from '@/components/features/landing/HeroSection'
import { TrustBar } from '@/components/features/landing/TrustBar'
import { FeaturesSection } from '@/components/features/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/features/landing/HowItWorksSection'
import { SaleModesSection } from '@/components/features/landing/SaleModesSection'
import { MarketSection } from '@/components/features/landing/MarketSection'
import { PricingTeaser } from '@/components/features/landing/PricingTeaser'
import { FinalCta } from '@/components/features/landing/FinalCta'
import { LandingFooter } from '@/components/features/landing/LandingFooter'

interface Props {
  params: { locale: string }
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const isAr = locale === 'ar'
  return {
    title: isAr
      ? 'CarSell — أدِر معرضك وبِع سياراتك بذكاء'
      : 'CarSell — Manage your showroom and sell smarter',
    description: isAr
      ? 'منصة SaaS متكاملة لمعارض السيارات في السعودية والخليج. إدارة المخزون، حساب الضريبة، ثلاث طرق بيع.'
      : 'A complete SaaS platform for car dealerships in Saudi Arabia and the Gulf. Inventory management, VAT calculation, three sale modes.',
  }
}

export default function LandingPage({ params: { locale } }: Props) {
  const isRtl = locale === 'ar'

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} lang={locale}>
      <LandingNavbar />
      <main>
        <HeroSection locale={locale} />
        <TrustBar />
        <FeaturesSection />
        <HowItWorksSection />
        <SaleModesSection />
        <MarketSection locale={locale} />
        <PricingTeaser locale={locale} />
        <FinalCta locale={locale} />
      </main>
      <LandingFooter locale={locale} />
    </div>
  )
}

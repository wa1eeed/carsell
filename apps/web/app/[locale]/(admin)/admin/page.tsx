import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import {
  Building2, CreditCard, Users, TrendingUp,
  Clock, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'نظرة عامة — CarSell Admin' }

async function getStats() {
  const [
    totalShowrooms,
    activeSubscriptions,
    trialSubscriptions,
    pastDueSubscriptions,
    totalCars,
    totalSales,
    pendingKyc,
  ] = await Promise.all([
    prisma.showroom.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE'   } }),
    prisma.subscription.count({ where: { status: 'TRIAL'    } }),
    prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
    prisma.car.count({ where: { deletedAt: null } }),
    prisma.sale.count(),
    prisma.showroomUser.count({ where: { kycStatus: 'PENDING' } }),
  ])
  return {
    totalShowrooms, activeSubscriptions, trialSubscriptions,
    pastDueSubscriptions, totalCars, totalSales, pendingKyc,
  }
}

export default async function AdminOverviewPage() {
  const s = await getStats()
  const t = await getTranslations('adminDashboard')

  const kpis = [
    { label: t('totalShowrooms'),       value: s.totalShowrooms,         icon: Building2,     color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: t('activeSubscriptions'),  value: s.activeSubscriptions,    icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: t('trialSubscriptions'),   value: s.trialSubscriptions,     icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50'  },
    { label: t('pastDue'),              value: s.pastDueSubscriptions,   icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50'    },
    { label: t('totalCars'),            value: s.totalCars,              icon: TrendingUp,    color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: t('totalSales'),           value: s.totalSales,             icon: CreditCard,    color: 'text-teal-600',   bg: 'bg-teal-50'   },
    { label: t('pendingKyc'),           value: s.pendingKyc,             icon: Users,         color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-white rounded-[12px] border border-gray-100 p-5">
              <div className={`w-9 h-9 rounded-[8px] ${k.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={k.color} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{k.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{k.label}</div>
            </div>
          )
        })}
      </div>

      {/* Alerts */}
      {(s.pastDueSubscriptions > 0 || s.pendingKyc > 0) && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">{t('alerts')}</h2>
          {s.pastDueSubscriptions > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-[8px] text-sm">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <span className="text-red-700">
                {t('pastDueAlert', { n: s.pastDueSubscriptions })}
              </span>
              <a href="/admin/showrooms?status=PAST_DUE" className="mr-auto text-red-600 font-medium hover:underline">
                {t('view')}
              </a>
            </div>
          )}
          {s.pendingKyc > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-[8px] text-sm">
              <Clock size={16} className="text-amber-500 shrink-0" />
              <span className="text-amber-700">
                {t('kycAlert', { n: s.pendingKyc })}
              </span>
              <a href="/admin/kyc" className="mr-auto text-amber-600 font-medium hover:underline">
                {t('review')}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Platform info */}
      <div className="bg-white rounded-[12px] border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">{t('platformStatus')}</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">{t('conversionRate')}</div>
            <div className="font-bold text-gray-900">
              {s.totalShowrooms > 0
                ? `${Math.round((s.activeSubscriptions / s.totalShowrooms) * 100)}%`
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">{t('avgCarsPerShowroom')}</div>
            <div className="font-bold text-gray-900">
              {s.totalShowrooms > 0
                ? Math.round(s.totalCars / s.totalShowrooms)
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">{t('salesRate')}</div>
            <div className="font-bold text-gray-900">
              {s.totalCars > 0
                ? `${Math.round((s.totalSales / s.totalCars) * 100)}%`
                : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

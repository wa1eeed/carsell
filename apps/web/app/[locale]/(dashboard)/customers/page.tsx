import { requirePageUser } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { Users, Phone, CreditCard, ShoppingBag } from 'lucide-react'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'العملاء — CarSell' }

export default async function CustomersPage() {
  const user = await requirePageUser()

  const customers = await prisma.customer.findMany({
    where:   { showroomId: user.showroomId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { sales: true } }, sales: { select: { sellPrice: true } } },
  })

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3460]">العملاء</h1>
        <p className="text-gray-500 text-sm mt-1">{customers.length} عميل مسجّل</p>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-gray-100 p-12 text-center text-gray-400">
          <Users size={36} className="mx-auto mb-3 text-gray-300" />
          لا يوجد عملاء بعد — يُضافون تلقائياً عند تسجيل أول بيع
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => {
            const totalSpent = c.sales.reduce((sum, s) => sum + Number(s.sellPrice), 0)
            return (
              <div key={c.id} className="bg-white rounded-[12px] border border-gray-100 p-5 hover:-translate-y-0.5 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0F3460]/10 rounded-full flex items-center justify-center text-[#0F3460] font-bold">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#0F3460] truncate">{c.name}</div>
                    {c.phone && (
                      <div className="text-xs text-gray-400 flex items-center gap-1 font-mono ltr">
                        <Phone size={10} /> {c.phone}
                      </div>
                    )}
                  </div>
                </div>

                {c.idNumber && (
                  <div className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                    <CreditCard size={11} /> <span className="font-mono ltr">{c.idNumber}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <ShoppingBag size={12} /> {c._count.sales} عملية شراء
                  </div>
                  {totalSpent > 0 && (
                    <div className="price-number font-mono ltr text-[#C9A84C] text-sm font-semibold">
                      {totalSpent.toLocaleString('ar-SA')} <span className="text-xs text-gray-400 font-sans">ريال</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

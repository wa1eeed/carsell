import { KpiSkeleton, TableSkeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48" />
      <KpiSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={4} />
        </div>
        <TableSkeleton rows={4} />
      </div>
      <TableSkeleton rows={5} />
    </div>
  )
}

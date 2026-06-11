import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton'

export default function CarDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableSkeleton rows={6} />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}

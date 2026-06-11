import { CardGridSkeleton } from '@/components/ui/Skeleton'

export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-9 w-32" />
      </div>
      <CardGridSkeleton count={8} />
    </div>
  )
}

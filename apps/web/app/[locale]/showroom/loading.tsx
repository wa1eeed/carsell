import { CardGridSkeleton } from '@/components/ui/Skeleton'

export default function ShowroomLoading() {
  return (
    <div className="min-h-screen bg-cl-gray-50">
      <div className="skeleton h-24 w-full" />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <CardGridSkeleton count={6} />
      </div>
    </div>
  )
}

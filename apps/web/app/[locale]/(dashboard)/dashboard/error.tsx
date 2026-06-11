'use client'

import { ErrorState } from '@/components/ui/ErrorState'

export default function SegmentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState reset={reset} />
}

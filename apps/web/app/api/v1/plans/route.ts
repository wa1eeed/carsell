/** GET /api/v1/plans — public list of plans for pricing page */

import { NextResponse } from 'next/server'
import { listPublicPlans } from '@/repositories/plan.repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  const plans = await listPublicPlans()
  return NextResponse.json({ plans })
}

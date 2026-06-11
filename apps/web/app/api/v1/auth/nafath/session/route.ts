import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok } from '@/lib/api-response'
import { createNafathWebSession } from '@/services/nafath.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return handle(async () => {
    const locale = req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar'
    const session = await createNafathWebSession(locale)
    return ok(session)
  })
}

// app/api/public-messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get('limit') || 50)
    const sort = (searchParams.get('sort') || 'createdAt') as string

    const result = await payload.find({
      collection: 'public-messages',
      limit,
      sort,
      overrideAccess: true,
    })

    return NextResponse.json({ docs: result.docs })
  } catch (err: any) {
    console.error('[GET /api/public-messages]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

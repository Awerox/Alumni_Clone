// app/api/forum/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

async function getUserFromToken(req: NextRequest, secret: string): Promise<any | null> {
  const token =
    req.cookies.get('payload-alumni-token')?.value ||
    req.cookies.get('payload-token')?.value
  if (!token) return null
  try {
    const decoded = verify(token, secret) as any
    if (decoded?.collection === 'alumni' && decoded?.id) return decoded
    return null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const user = await getUserFromToken(req, payload.secret)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { discussionId, message } = await req.json()

    const current: any = await payload.findByID({
      collection: 'discussions',
      id: discussionId,
      overrideAccess: true,
    })

    if (!current) {
      return NextResponse.json({ error: 'Discussion introuvable' }, { status: 404 })
    }

    const existants = current.commentaires || []

    const updated = await payload.update({
      collection: 'discussions',
      id: discussionId,
      overrideAccess: true,
      data: {
        commentaires: [
          ...existants,
          { auteur: user.id, message },
        ],
      },
    })

    return NextResponse.json({ success: true, discussion: updated })
  } catch (err: any) {
    console.error('[POST /api/forum]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
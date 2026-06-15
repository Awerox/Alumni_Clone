// src/app/api/group-posts/route.ts
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

// GET /api/group-posts?groupId=X
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId')
    if (!groupId) return NextResponse.json({ error: 'groupId requis' }, { status: 400 })

    const result = await payload.find({
      collection: 'group-posts' as any,
      where: { group: { equals: Number(groupId) } },
      sort: '-createdAt',
      limit: 50,
      depth: 2,
      overrideAccess: true,
    })

    return NextResponse.json({ docs: result.docs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/group-posts
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const user = await getUserFromToken(req, payload.secret)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await req.json()
    const { groupId, content, imageId, type } = body

    if (!groupId) return NextResponse.json({ error: 'groupId requis' }, { status: 400 })
    if (!content?.trim() && !imageId) return NextResponse.json({ error: 'Contenu ou image requis' }, { status: 400 })

    const post = await payload.create({
      collection: 'group-posts' as any,
      overrideAccess: true,
      data: {
        group: Number(groupId),
        author: Number(user.id),
        content: content?.trim() || '',
        type: type || 'post',
        ...(imageId ? { image: Number(imageId) } : {}),
      } as any,
    })

    return NextResponse.json({ success: true, doc: post })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/group-posts?postId=X
export async function DELETE(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const user = await getUserFromToken(req, payload.secret)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('postId')
    if (!postId) return NextResponse.json({ error: 'postId requis' }, { status: 400 })

    await payload.delete({
      collection: 'group-posts' as any,
      id: Number(postId),
      overrideAccess: true,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
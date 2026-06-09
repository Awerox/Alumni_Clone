// lib/auth.ts
// Helper partagé pour vérifier la session dans les Server Components et Route Handlers
// Compatible avec les tokens OAuth (jsonwebtoken) ET les tokens natifs Payload

import { cookies, headers } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

export interface AuthResult {
  user: any | null
  payload: Awaited<ReturnType<typeof getPayload>>
}

export async function getAuthUser(): Promise<AuthResult> {
  const payload = await getPayload({ config: configPromise })
  const secret = payload.secret

  // ── 1. Lire le cookie depuis les headers de la requête serveur ────────────
  const cookieStore = await cookies()
  const token =
    cookieStore.get('payload-alumni-token')?.value ||
    cookieStore.get('payload-token')?.value

  if (!token) {
    return { user: null, payload }
  }

  // ── 2. Vérifier le JWT avec le secret brut ────────────────────────────────
  try {
    const decoded = verify(token, secret) as any

    if (!decoded?.id || decoded?.collection !== 'alumni') {
      return { user: null, payload }
    }

    const user = await payload.findByID({
      collection: 'alumni',
      id: decoded.id,
      depth: 1,
    })

    return { user: user ?? null, payload }
  } catch {
    // Token invalide ou expiré
    return { user: null, payload }
  }
}
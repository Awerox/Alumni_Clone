// lib/auth.ts
// Helper partagé pour vérifier la session dans les Server Components et Route Handlers
// Compatible avec les tokens OAuth (jsonwebtoken) ET les tokens natifs Payload

import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'
import { cache } from 'react'

export interface AuthResult {
  user: any | null
  payload: Awaited<ReturnType<typeof getPayload>>
}

// ✅ Cache l'instance Payload pour toute la durée d'une requête serveur
// Évite de recharger la config à chaque appel getAuthUser()
const getPayloadInstance = cache(async () => {
  return getPayload({ config: configPromise })
})

export async function getAuthUser(): Promise<AuthResult> {
  const payload = await getPayloadInstance()
  const secret = payload.secret

  // ── 1. Lire le cookie ─────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const token =
    cookieStore.get('payload-alumni-token')?.value ||
    cookieStore.get('payload-token')?.value

  if (!token) {
    return { user: null, payload }
  }

  // ── 2. Vérifier le JWT ────────────────────────────────────────────────────
  try {
    const decoded = verify(token, secret) as any

    if (!decoded?.id || decoded?.collection !== 'alumni') {
      return { user: null, payload }
    }

    // ✅ Utilise les données du token directement sans requête DB
    // Le token contient déjà id, email, collection — suffisant pour l'auth
    // On ne fait un findByID que si on a besoin de données fraîches (photo, nom...)
    const user = {
      id: decoded.id,
      email: decoded.email ?? '',
      collection: decoded.collection,
      // Champs souvent utilisés dans les pages
      prenom: decoded.prenom ?? '',
      nom: decoded.nom ?? '',
    }

    return { user, payload }
  } catch {
    // Token invalide ou expiré
    return { user: null, payload }
  }
}

// ✅ Version complète avec données fraîches depuis la DB
// À utiliser uniquement quand on a besoin du profil complet (photo, bio, etc.)
export async function getAuthUserFull(): Promise<AuthResult> {
  const payload = await getPayloadInstance()
  const secret = payload.secret

  const cookieStore = await cookies()
  const token =
    cookieStore.get('payload-alumni-token')?.value ||
    cookieStore.get('payload-token')?.value

  if (!token) {
    return { user: null, payload }
  }

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
    return { user: null, payload }
  }
}
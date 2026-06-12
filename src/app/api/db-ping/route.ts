import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Route appelée périodiquement (UptimeRobot) pour garder la connexion
// Postgres Neon active et éviter le cold start de la base.
export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Requête minimale pour réveiller/maintenir la connexion DB
    await payload.db.drizzle.execute('SELECT 1')

    return NextResponse.json({ ok: true, db: 'awake', ts: Date.now() })
  } catch (err) {
    console.error('[db-ping]', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
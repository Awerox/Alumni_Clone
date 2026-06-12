import { NextResponse } from 'next/server'

// Route volontairement minimaliste : ne charge PAS Payload,
// juste pour réveiller/garder chaude la fonction serverless.
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() })
}
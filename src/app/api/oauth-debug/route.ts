// Fichier temporaire de debug : app/api/oauth-debug/route.ts
// Ajoute ce fichier, connecte-toi normalement avec email/password,
// puis visite http://localhost:3000/api/oauth-debug
// Il va afficher tous tes cookies pour qu'on voie le nom exact

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cookies = req.cookies.getAll()
  return NextResponse.json({
    cookies: cookies.map(c => ({ name: c.name, valueLength: c.value.length, preview: c.value.substring(0, 30) + '...' }))
  })
}

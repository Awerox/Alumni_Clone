import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList as any })

  // Si pas d'utilisateur authentifié
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { to, message } = await req.json()

    // Sauvegarde persistante dans Payload CMS
    const savedMsg = await (payload.create as any)({
      collection: 'direct-messages',
      data: {
        from: user.id,
        to,
        message,
      },
    })

    // 🎯 CORRECTION TYPAGE : Forcer l'interprétation en tant que type "any" pour éviter le conflit User/Alumni
    const alumniUser = user as any
    const displayPrenom = alumniUser.prenom || 'Membres'
    const displayNom = alumniUser.nom || 'ENC'

    // Alerte via SSE Stream pour la distribution instantanée en direct
    const streamUrl = `${new URL(req.url).origin}/api/chat/stream`
    await fetch(streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'msg-prive',
        from: user.id,
        to,
        user: `${displayPrenom} ${displayNom}`,
        text: message,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }),
    })

    return NextResponse.json({ success: true, doc: savedMsg })
  } catch (err: any) {
    console.error("Erreur d'envoi du message privé:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
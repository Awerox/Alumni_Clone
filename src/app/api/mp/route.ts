import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

// GET /api/mp?with=<alumniId> — charge l'historique entre moi et un autre alumni
export async function GET(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList as any })

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const withId = searchParams.get('with')

  if (!withId) {
    return NextResponse.json({ error: 'Paramètre "with" manquant' }, { status: 400 })
  }

  const myId = Number(user.id)
  const otherId = Number(withId)

  try {
    const result = await payload.find({
      collection: 'direct-messages',
      where: {
        or: [
          { and: [{ from: { equals: myId } }, { to: { equals: otherId } }] },
          { and: [{ from: { equals: otherId } }, { to: { equals: myId } }] },
        ],
      },
      sort: 'createdAt',
      limit: 100,
      depth: 1, // Pour populated from/to avec prenom/nom
    })

    return NextResponse.json({ docs: result.docs })
  } catch (err: any) {
    console.error('Erreur chargement MP:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/mp — envoyer un message
export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList as any })

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { to, message, fileId, fileUrl, fileName } = await req.json()

    if (!to) {
      return NextResponse.json({ error: 'Destinataire manquant' }, { status: 400 })
    }
    if (!message && !fileId) {
      return NextResponse.json({ error: 'Message ou fichier requis' }, { status: 400 })
    }

    const fromId = Number(user.id)
    const toId = Number(to)

    // Vérifier que le destinataire existe
    const toAlumni = await payload.findByID({
      collection: 'alumni',
      id: toId,
    }).catch(() => null)

    if (!toAlumni) {
      return NextResponse.json({ error: `Destinataire introuvable (id: ${toId})` }, { status: 400 })
    }

    // Créer le message en BDD
    const savedMsg = await (payload.create as any)({
      collection: 'direct-messages',
      data: {
        from: fromId,
        to: toId,
        message: message || '',
        ...(fileId ? { file: Number(fileId) } : {}),
      },
    })

    const alumniUser = user as any
    const displayPrenom = alumniUser.prenom || 'Membre'
    const displayNom = alumniUser.nom || 'ENC'

    // Notification SSE temps réel
    const streamUrl = `${new URL(req.url).origin}/api/chat/stream`
    await fetch(streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'msg-prive',
        from: String(fromId),
        to: String(toId),
        user: `${displayPrenom} ${displayNom}`,
        text: message || '',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }),
    })

    return NextResponse.json({ success: true, doc: savedMsg })
  } catch (err: any) {
    console.error("Erreur d'envoi du message privé:", err)
    return NextResponse.json({ error: err.message, details: err?.data }, { status: 500 })
  }
}

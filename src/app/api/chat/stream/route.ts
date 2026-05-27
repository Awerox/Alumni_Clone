import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Structure globale pour retenir les connexions clients actives en mémoire vive
type ClientConnection = {
  id: string
  name: string
  controller: ReadableStreamDefaultController
}

let activeClients: ClientConnection[] = []

export async function GET(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const userName = searchParams.get('name') || 'Anonyme'

  if (!userId) {
    return new Response('Missing userId', { status: 400 })
  }

  const stream = new ReadableStream({
    start(controller) {
      // Enregistrer le nouveau client connecté
      const newClient: ClientConnection = {
        id: userId,
        name: userName,
        controller,
      }
      activeClients.push(newClient)

      // Diffuser la liste mise à jour des personnes connectées à tout le monde
      broadcast({
        type: 'presence',
        users: activeClients.map((c) => c.name),
      })

      // Garder la connexion ouverte (Heartbeat)
      const interval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'))
        } catch {
          clearInterval(interval)
        }
      }, 15000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        activeClients = activeClients.filter((c) => c.id !== userId)
        broadcast({
          type: 'presence',
          users: activeClients.map((c) => c.name),
        })
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keepalive',
    },
  })
}

// Fonction pour émettre un événement SSE général
function broadcast(data: any) {
  const encodedData = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
  activeClients.forEach((client) => {
    try {
      client.controller.enqueue(encodedData)
    } catch {
      // Nettoyage si le client s'est déconnecté brusquement
    }
  })
}

// Route POST pour envoyer un message et forcer sa mise à jour en direct chez les autres
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const encodedData = new TextEncoder().encode(`data: ${JSON.stringify(body)}\n\n`)
    
    // Distribuer aux clients concernés
    activeClients.forEach((client) => {
      try {
        if (body.type === 'msg-prive') {
          // Si privé, envoyer uniquement à l'expéditeur ou au destinataire ciblé
          if (client.id === body.to || client.id === body.from) {
            client.controller.enqueue(encodedData)
          }
        } else {
          // Si public, envoyer à tout le monde
          client.controller.enqueue(encodedData)
        }
      } catch {}
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
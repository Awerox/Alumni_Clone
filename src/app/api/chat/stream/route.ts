import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

type ClientConnection = {
  id: string
  name: string
  prenom: string
  nom: string
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

  const nameParts = decodeURIComponent(userName).split(' ')
  const prenom = nameParts[0] || ''
  const nom = nameParts.slice(1).join(' ') || ''

  const stream = new ReadableStream({
    start(controller) {
      const newClient: ClientConnection = {
        id: userId,
        name: decodeURIComponent(userName),
        prenom,
        nom,
        controller,
      }
      activeClients.push(newClient)

      // Diffuse la liste complète avec les ids pour que le front puisse identifier les destinataires
      broadcastPresence()

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
        broadcastPresence()
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

// Diffuse la présence avec les objets complets (id, name, prenom, nom)
function broadcastPresence() {
  const users = activeClients.map((c) => ({
    id: c.id,
    name: c.name,
    prenom: c.prenom,
    nom: c.nom,
  }))
  broadcast({ type: 'presence-full', users })
}

function broadcast(data: any) {
  const encodedData = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
  activeClients.forEach((client) => {
    try {
      client.controller.enqueue(encodedData)
    } catch {
      // Client déconnecté
    }
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const encodedData = new TextEncoder().encode(`data: ${JSON.stringify(body)}\n\n`)

    activeClients.forEach((client) => {
      try {
        if (body.type === 'msg-prive') {
          if (client.id === body.to || client.id === body.from) {
            client.controller.enqueue(encodedData)
          }
        } else {
          client.controller.enqueue(encodedData)
        }
      } catch {}
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

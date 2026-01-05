import yts from 'yt-search'

const MAX_SECONDS = 90 * 60
const HTTP_TIMEOUT_MS = 90 * 1000
const API_KEY = 'Angxlllll'
const API_BASE = 'https://api-adonix.ultraplus.click'

function parseDurationToSeconds(d) {
  if (d == null) return null
  if (typeof d === 'number' && Number.isFinite(d)) return Math.max(0, Math.floor(d))
  const s = String(d).trim()
  if (!s) return null
  if (/^\d+$/.test(s)) return Math.max(0, parseInt(s, 10))
  const parts = s.split(':').map(v => v.trim()).filter(Boolean)
  if (!parts.length || parts.some(p => !/^\d+$/.test(p))) return null
  let sec = 0
  for (const p of parts) sec = sec * 60 + parseInt(p, 10)
  return Number.isFinite(sec) ? sec : null
}

async function fetchJson(url, timeoutMs = HTTP_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    const txt = await res.text()
    const data = JSON.parse(txt)
    if (!res.ok || !data?.status) throw new Error(data?.message || 'Error API')
    return data
  } finally {
    clearTimeout(t)
  }
}

async function fetchBuffer(url, timeoutMs = HTTP_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error('No se pudo descargar')
    const ab = await res.arrayBuffer()
    return Buffer.from(ab)
  } finally {
    clearTimeout(t)
  }
}

let handler = async (m, { conn, usedPrefix, command }) => {
  const from = m.chat

  const body = m.text || ''
  const raw = body.replace(new RegExp(`^\\${usedPrefix}${command}\\s*`, 'i'), '')
  const input = String(raw || '').trim()

  if (!input) {
    return conn.sendMessage(from, {
      text: `✳️ Usa:\n${usedPrefix}${command} <nombre de canción>\nEj:\n${usedPrefix}${command} Lemon Tree`
    }, { quoted: m })
  }

  await conn.sendMessage(from, { react: { text: '🕒', key: m.key } })

  const search = await yts(input)
  const video = search?.videos?.[0]
  if (!video) {
    return conn.sendMessage(from, { text: '❌ Sin resultados.' }, { quoted: m })
  }

  const durationSec = parseDurationToSeconds(video.seconds || video.timestamp)
  if (durationSec && durationSec > MAX_SECONDS) {
    return conn.sendMessage(from, { text: '❌ El contenido supera el límite permitido.' }, { quoted: m })
  }

  const caption =
`⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${video.title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${video.author?.name || 'Desconocido'}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${video.timestamp || 'Desconocida'}

Selecciona el formato 👇
`

  await conn.sendMessage(from, {
    image: { url: video.thumbnail },
    caption,
    buttons: [
      { buttonId: `${usedPrefix}${command} audio|${video.url}`, buttonText: { displayText: '🎵 Audio' }, type: 1 },
      { buttonId: `${usedPrefix}${command} video|${video.url}`, buttonText: { displayText: '🎬 Video' }, type: 1 }
    ],
    headerType: 4
  }, { quoted: m })
}

handler.before = async (m, { conn }) => {
  if (!m.text) return

  const body = m.text.trim()
  if (!body.startsWith('.play audio|') && !body.startsWith('.play video|')) return

  const [, payload] = body.split('.play ')
  const [type, url] = payload.split('|')
  const from = m.chat

  await conn.sendMessage(from, {
    react: { text: type === 'audio' ? '🎵' : '🎬', key: m.key }
  })

  try {
    if (type === 'audio') {
      const api = `${API_BASE}/download/ytaudio?apikey=${API_KEY}&url=${encodeURIComponent(url)}`
      const data = await fetchJson(api)
      const buffer = await fetchBuffer(data.data.url)

      await conn.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        fileName: `${data.data.title}.mp3`
      }, { quoted: m })
    }

    if (type === 'video') {
      const api = `${API_BASE}/download/ytvideo?apikey=${API_KEY}&url=${encodeURIComponent(url)}`
      const data = await fetchJson(api)

      await conn.sendMessage(from, {
        video: { url: data.data.url },
        mimetype: 'video/mp4',
        fileName: `${data.data.title}.mp4`
      }, { quoted: m })
    }

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } })
  } catch (e) {
    await conn.sendMessage(from, { text: '❌ Error al descargar.' }, { quoted: m })
  }
}

handler.help = ['play <texto>']
handler.tags = ['multimedia']
handler.command = ['play']

export default handler
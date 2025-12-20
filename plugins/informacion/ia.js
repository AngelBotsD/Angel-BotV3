// plugins/angel-mention.js
import fetch from 'node-fetch'

const API_KEY = 'may-0595dca2'
const API_URL = 'https://mayapi.ooguy.com/ai-pukamind'

const handler = async (m, { conn }) => {
  try {
    if (!m.message) return

    // JID del bot
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net'
    const botNum = botJid.split('@')[0]

    // Obtener texto real
    const text =
      m.text ||
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      ''

    if (!text) return

    // Detectar mención (COMPATIBLE ds6)
    const mentionedJids =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    const isMentioned =
      mentionedJids.includes(botJid) ||
      text.includes(`@${botNum}`)

    if (!isMentioned) return

    // Limpiar texto quitando la mención
    const cleanText = text
      .replace(new RegExp(`@${botNum}`, 'g'), '')
      .trim()

    if (!cleanText) {
      return conn.sendMessage(
        m.chat,
        { text: '👀 Mencióname y dime algo.' },
        { quoted: m }
      )
    }

    // Llamar API
    const url = `${API_URL}?q=${encodeURIComponent(cleanText)}&apikey=${API_KEY}`
    const res = await fetch(url)
    const json = await res.json()

    if (!json.status || !json.result) {
      return m.reply('❌ La IA no respondió.')
    }

    // Responder
    await conn.sendMessage(
      m.chat,
      {
        text: json.result,
        mentions: [m.sender]
      },
      { quoted: m }
    )

  } catch (err) {
    console.error('Angel IA error:', err)
  }
}

// 👇 ESTO ES CLAVE EN ESA BUILD
handler.command = /.*/
handler.customPrefix = /@/i

export default handler
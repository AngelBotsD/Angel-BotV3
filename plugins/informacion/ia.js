// plugins/angel-mention.js
import fetch from 'node-fetch'

const API_KEY = 'may-0595dca2'
const API_URL = 'https://mayapi.ooguy.com/ai-pukamind'

const handler = async (m, { conn }) => {
  try {
    // ID del bot
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net'

    // Mensajes de texto
    const text =
      m.text ||
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      ''

    if (!text) return

    // Verificar mención al bot
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (!mentioned.includes(botJid)) return

    // Quitar la mención del texto
    const cleanText = text
      .replace(new RegExp(`@${botJid.split('@')[0]}`, 'g'), '')
      .trim()

    if (!cleanText) return m.reply('👀 Mencióname y dime algo.')

    // Llamada a la API
    const url = `${API_URL}?q=${encodeURIComponent(cleanText)}&apikey=${API_KEY}`
    const res = await fetch(url)
    const json = await res.json()

    if (!json.status) {
      return m.reply('❌ Error al responder.')
    }

    // Responder mencionando al usuario
    await conn.sendMessage(
      m.chat,
      {
        text: json.result,
        mentions: [m.sender]
      },
      { quoted: m }
    )

  } catch (e) {
    console.error(e)
  }
}

handler.customPrefix = /@/i
handler.command = new RegExp('')

export default handler
import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'

let handler = m => m

handler.all = async function (m, { conn }) {
  let chat = global.db.data.chats[m.chat]
  if (!chat || chat.isBanned || !chat.autoresponder) return true
  if (m.fromMe) return true

  m.isBot = (
    m.id?.startsWith('BAE5') && m.id.length === 16 ||
    m.id?.startsWith('3EB0') && [12,20,22].includes(m.id.length) ||
    m.id?.startsWith('B24E') && m.id.length === 20
  )
  if (m.isBot) return true

  let text = (m.text || '').trim()
  if (!text) return true

  let prefixRegex = new RegExp('^[' + (opts?.prefix || '‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-')
    .replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
  if (prefixRegex.test(text)) return true

  if (m.sender?.toLowerCase().includes('bot')) return true

  const botJid = this.user.jid

  const isReplyToBot =
    m.quoted &&
    (m.quoted.sender === botJid || m.quoted.fromMe)

  const isMentionBot =
    m.mentionedJid &&
    m.mentionedJid.includes(botJid)

  const isCallingBot =
    /\b(bot|angel bot|ángel bot)\b/i.test(text)

  if (!(isReplyToBot || isMentionBot || isCallingBot)) return true

  await this.sendPresenceUpdate('composing', m.chat)

  let username = m.pushName || 'Usuario'

  let txtDefault = `
Eres ${botname}, una inteligencia artificial avanzada creada por ${etiqueta} para WhatsApp.
Responde de forma clara, natural y amigable.
`.trim()

  let logic = chat.sAutoresponder || txtDefault

  try {
    const apiUrl = `https://g-mini-ia.vercel.app/api/mode-ia?prompt=${encodeURIComponent(text)}&id=${encodeURIComponent(username)}&logic=${encodeURIComponent(logic)}`
    const res = await fetch(apiUrl)
    const data = await res.json()

    let result = data.result || data.answer || data.response
    if (!result) return true

    await this.reply(m.chat, result.trim(), m, rcanal)
  } catch (e) {
    console.error(e)
    await this.reply(m.chat, '⚠️ Error al responder con la IA.', m)
  }

  return true
}

export default handler
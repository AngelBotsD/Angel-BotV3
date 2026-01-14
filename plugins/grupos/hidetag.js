import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

let thumb = null
fetch('https://files.catbox.moe/mx6p6q.jpg')
  .then(r => r.arrayBuffer())
  .then(b => (thumb = Buffer.from(b)))
  .catch(() => null)

function unwrapMessage(m = {}) {
  let n = m
  while (
    n?.viewOnceMessage?.message ||
    n?.viewOnceMessageV2?.message ||
    n?.viewOnceMessageV2Extension?.message ||
    n?.ephemeralMessage?.message
  ) {
    n =
      n.viewOnceMessage?.message ||
      n.viewOnceMessageV2?.message ||
      n.viewOnceMessageV2Extension?.message ||
      n.ephemeralMessage?.message
  }
  return n
}

function getText(m) {
  const msg = unwrapMessage(m.message) || {}
  return (
    m.text ||
    m.msg?.caption ||
    msg.extendedTextMessage?.text ||
    msg.conversation ||
    ''
  )
}

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const content = getText(m).trim()
  if (!/^\.?n(\s|$)/i.test(content)) return

  await conn.sendMessage(m.chat, {
    react: { text: '🗣️', key: m.key }
  })

  const users = [...new Set(participants.map(p => conn.decodeJid(p.id)))]

  const fkontak = {
    key: {
      remoteJid: m.chat,
      fromMe: false,
      id: 'Angel'
    },
    message: {
      locationMessage: {
        name: `𝖧𝗈𝗅𝖺, 𝖲𝗈𝗒 ${global.author}`,
        jpegThumbnail: thumb
      }
    },
    participant: '0@s.whatsapp.net'
  }

  const q = m.quoted ? unwrapMessage(m.quoted) : unwrapMessage(m)

  const mtype =
    m.quoted?.mtype ||
    Object.keys(q.message || {})[0] ||
    (q.conversation ? 'conversation' : '')

  const userText = content.replace(/^\.?n(\s|$)/i, '').trim()
  const baseText =
    q.text ||
    q.msg?.caption ||
    q.conversation ||
    ''

  const caption = userText || baseText || '🔊 Notificación'

  const isImage = mtype === 'imageMessage'
  const isVideo = mtype === 'videoMessage'
  const isAudio = mtype === 'audioMessage'
  const isSticker = mtype === 'stickerMessage'

  try {
    if (m.quoted && (isImage || isVideo || isAudio || isSticker)) {
      const buffer = await m.quoted.download()
      const msg = { mentions: users }

      if (isImage) {
        msg.image = buffer
        msg.caption = caption
      } else if (isVideo) {
        msg.video = buffer
        msg.caption = caption
        msg.mimetype = 'video/mp4'
      } else if (isAudio) {
        msg.audio = buffer
        msg.mimetype = 'audio/mpeg'
        msg.ptt = false
      } else if (isSticker) {
        msg.sticker = buffer
      }

      await conn.sendMessage(m.chat, msg, { quoted: fkontak })

      if (isAudio && userText) {
        await conn.sendMessage(
          m.chat,
          { text: userText, mentions: users },
          { quoted: fkontak }
        )
      }

      return
    }

    return conn.sendMessage(
      m.chat,
      { text: caption, mentions: users },
      { quoted: fkontak }
    )

  } catch {
    return conn.sendMessage(
      m.chat,
      { text: '🔊 Notificación', mentions: users },
      { quoted: fkontak }
    )
  }
}

handler.help = ['𝖭𝗈𝗍𝗂𝖿𝗒']
handler.tags = ['𝖦𝖱𝖴𝖯𝖮𝖲']
handler.customPrefix = /^\.?n(\s|$)/i
handler.command = new RegExp()
handler.group = true
handler.admin = true

export default handler
import { generateWAMessageFromContent, downloadContentFromMessage } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

let thumb = null
fetch('https://files.catbox.moe/js07dr.jpg')
  .then(r => r.arrayBuffer())
  .then(b => thumb = Buffer.from(b))
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

function getMessageText(m) {
  const msg = unwrapMessage(m.message) || {}
  return (
    m.text ||
    m.msg?.caption ||
    msg?.extendedTextMessage?.text ||
    msg?.conversation ||
    ''
  )
}

async function downloadMedia(msgContent, type) {
  try {
    const stream = await downloadContentFromMessage(msgContent, type)
    let buffer = Buffer.alloc(0)
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
  } catch {
    return null
  }
}

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const content = getMessageText(m).trim()
  if (!/^\.?n(\s|$)/i.test(content)) return

  const q = m.quoted ? unwrapMessage(m.quoted) : null
  if (!q) return

  const mtype = q.mtype || Object.keys(q.message || {})[0] || ''
  const isImage = mtype === 'imageMessage'
  const isVideo = mtype === 'videoMessage'
  const isAudio = mtype === 'audioMessage'
  const isSticker = mtype === 'stickerMessage'

  if (!isImage && !isVideo && !isAudio && !isSticker) return

  await conn.sendMessage(m.chat, { react: { text: '🗣️', key: m.key } })

  const users = [...new Set(participants.map(p => conn.decodeJid(p.id)))]

  const userText = content.replace(/^\.?n(\s|$)/i, '').trim()
  const originalCaption = (q.msg?.caption || q.text || '').trim()
  const caption = userText || originalCaption || ''

  let buffer = null
  if (q[mtype]) {
    const detected = mtype.replace('Message', '').toLowerCase()
    buffer = await downloadMedia(q[mtype], detected)
  }
  if (!buffer && q.download) buffer = await q.download()
  if (!buffer) return

  const fkontak = {
    key: {
      remoteJid: m.chat,
      fromMe: false,
      id: 'Angel'
    },
    message: {
      locationMessage: {
        name: '𝖧𝗈𝗅𝖺, 𝖲𝗈𝗒 SHADOW BOT',
        jpegThumbnail: thumb
      }
    },
    participant: '0@s.whatsapp.net'
  }

  if (isAudio) {
    await conn.sendMessage(
      m.chat,
      {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        mentions: users
      },
      { quoted: fkontak }
    )
    if (userText)
      await conn.sendMessage(
        m.chat,
        { text: userText, mentions: users },
        { quoted: fkontak }
      )
    return
  }

  if (isSticker) {
    await conn.sendMessage(
      m.chat,
      { sticker: buffer, mentions: users },
      { quoted: fkontak }
    )
    return
  }

  if (isImage) {
    await conn.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: caption || undefined,
        mentions: users
      },
      { quoted: fkontak }
    )
    return
  }

  if (isVideo) {
    await conn.sendMessage(
      m.chat,
      {
        video: buffer,
        caption: caption || undefined,
        mimetype: 'video/mp4',
        mentions: users
      },
      { quoted: fkontak }
    )
    return
  }
}

handler.help = ['notify']
handler.tags = ['group']
handler.customPrefix = /^\.?n(\s|$)/i
handler.command = new RegExp()
handler.group = true
handler.admin = true
export default handler
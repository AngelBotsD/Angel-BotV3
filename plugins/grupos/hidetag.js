import fetch from "node-fetch"

let thumb = null
fetch("https://files.catbox.moe/mx6p6q.jpg")
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

function getText(m) {
  const msg = unwrapMessage(m)?.message || unwrapMessage(m)

  return (
    m?.text ||
    msg?.extendedTextMessage?.text ||
    msg?.conversation ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    ""
  )
}

async function getBuffer(media) {
  if (!media?.download) return null
  const stream = await media.download()
  let buffer = Buffer.alloc(0)
  for await (const chunk of stream)
    buffer = Buffer.concat([buffer, chunk])
  return buffer
}

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup) return

  await conn.sendMessage(m.chat, {
    react: { text: "📢", key: m.key }
  })

  const users = [...new Set(participants.map(p => conn.decodeJid(p.id)))]

  const fkontak = {
    key: { remoteJid: m.chat, fromMe: false, id: "notif" },
    message: {
      locationMessage: {
        name: `Hola soy ${global.author}`,
        jpegThumbnail: thumb
      }
    },
    participant: "0@s.whatsapp.net"
  }

  const content = getText(m)
  if (!/^\.?n(\s|$)/i.test(content.trim())) return

  const quotedRaw = m.quoted || m
  const mtype = quotedRaw.mtype || Object.keys(quotedRaw || {})[0] || ""

  const cmdText = content.replace(/^\.?n(\s|$)/i, "").trim()
  const quotedText = getText(quotedRaw).trim()
  const finalText = cmdText || quotedText

  const isMedia = ["imageMessage", "videoMessage", "audioMessage", "stickerMessage"].includes(mtype)

  if (!isMedia) {
    if (!finalText) return
    return conn.sendMessage(
      m.chat,
      { text: finalText, mentions: users },
      { quoted: fkontak }
    )
  }

  if ((mtype === "audioMessage" || mtype === "stickerMessage") && !m.quoted)
    return

  const buffer = await getBuffer(quotedRaw)
  if (!buffer) return

  const msg = { mentions: users }

  if (mtype === "imageMessage") {
    msg.image = buffer
    if (finalText) msg.caption = finalText
  }

  if (mtype === "videoMessage") {
    msg.video = buffer
    msg.mimetype = "video/mp4"
    if (finalText) msg.caption = finalText
  }

  if (mtype === "audioMessage") {
    msg.audio = buffer
    msg.mimetype = "audio/mpeg"
    msg.ptt = false
  }

  if (mtype === "stickerMessage") {
    msg.sticker = buffer
  }

  await conn.sendMessage(m.chat, msg, { quoted: fkontak })
}

handler.customPrefix = /^\.?n(\s|$)/i
handler.command = new RegExp()
handler.group = true
handler.admin = true

export default handler
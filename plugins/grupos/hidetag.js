import fetch from "node-fetch"

let thumb = null
fetch("https://files.catbox.moe/mx6p6q.jpg")
  .then(r => r.arrayBuffer())
  .then(b => thumb = Buffer.from(b))
  .catch(() => null)

function getText(m) {
  return (
    m?.text ||
    m?.msg?.caption ||
    m?.msg?.text ||
    m?.msg?.conversation ||
    ""
  )
}

async function getBuffer(m) {
  if (!m) return null

  const type = m.mtype || ""
  if (!type.endsWith("Message")) return null

  if (!["imageMessage", "videoMessage", "audioMessage", "stickerMessage"].includes(type))
    return null

  if (typeof m.download !== "function") return null

  const stream = await m.download()
  let buffer = Buffer.alloc(0)

  for await (const chunk of stream) {
    if (!Buffer.isBuffer(chunk)) continue
    buffer = Buffer.concat([buffer, chunk])
  }

  return buffer.length ? buffer : null
}

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup) return

  const content = getText(m)
  if (!/^\.?n(\s|$)/i.test(content.trim())) return

  await conn.sendMessage(m.chat, {
    react: { text: "📢", key: m.key }
  })

  const users = [...new Set(participants.map(p => conn.decodeJid(p.id)))]

  const fkontak = {
    key: {
      remoteJid: m.chat,
      fromMe: false,
      id: "notif",
      participant: "0@s.whatsapp.net"
    },
    message: {
      locationMessage: {
        name: `Hola soy ${global.author}`,
        jpegThumbnail: thumb
      }
    }
  }

  const target = m.quoted || m
  const mtype = target.mtype

  const cmdText = content.replace(/^\.?n(\s|$)/i, "").trim()
  const quotedText = getText(target).trim()
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

  const buffer = await getBuffer(target)
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
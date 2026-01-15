import fetch from "node-fetch"

let thumb = null
fetch("https://files.catbox.moe/mx6p6q.jpg")
  .then(r => r.arrayBuffer())
  .then(b => (thumb = Buffer.from(b)))
  .catch(() => null)

async function getBuffer(media) {
  if (!media) return null

  if (typeof media.download === "function") {
    const stream = await media.download()
    if (Buffer.isBuffer(stream)) return stream

    let buffer = Buffer.alloc(0)
    for await (const chunk of stream)
      buffer = Buffer.concat([buffer, chunk])

    return buffer
  }

  return null
}

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.fromMe) return

  await conn.sendMessage(m.chat, {
    react: { text: "🥵", key: m.key }
  })

  const quoted = m.quoted
  let media = quoted || m
  let type = media.mtype

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

  if (!["imageMessage", "videoMessage", "audioMessage", "stickerMessage"].includes(type)) {
    let text = ""

    if (quoted?.text) {
      text = quoted.text
    } else {
      text = (m.text || "")
        .replace(/^[.]?n(\s|$)/i, "")
        .trim()
    }

    if (!text) return

    return await conn.sendMessage(
      m.chat,
      { text, mentions: users },
      { quoted: fkontak }
    )
  }

  if ((type === "audioMessage" || type === "stickerMessage") && !quoted)
    return

  let finalText = ""

  if (media === m) {
    if (!["imageMessage", "videoMessage"].includes(type)) return

    finalText = (m.msg?.caption || "")
      .replace(/^[.]?n(\s|$)/i, "")
      .trim()
  } else {
    finalText =
      (m.text || "")
        .replace(/^[.]?n(\s|$)/i, "")
        .trim() ||
      quoted?.text ||
      ""
  }

  const buffer = await getBuffer(media)
  if (!buffer) return

  let msg = { mentions: users }

  if (type === "imageMessage") {
    msg.image = buffer
    if (finalText) msg.caption = finalText
  }

  if (type === "videoMessage") {
    msg.video = buffer
    msg.mimetype = "video/mp4"
    if (finalText) msg.caption = finalText
  }

  if (type === "audioMessage") {
    msg.audio = buffer
    msg.mimetype = "audio/mpeg"
    msg.ptt = false
  }

  if (type === "stickerMessage") {
    msg.sticker = buffer
  }

  await conn.sendMessage(m.chat, msg, { quoted: fkontak })
}

handler.customPrefix = /^[.]?n(\s|$)/i
handler.command = new RegExp()
handler.group = true
handler.admin = true

export default handler
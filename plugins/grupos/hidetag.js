import fetch from "node-fetch"

let thumb = null
fetch("https://files.catbox.moe/mx6p6q.jpg")
  .then(r => r.arrayBuffer())
  .then(b => (thumb = Buffer.from(b)))
  .catch(() => null)

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.fromMe) return

  await conn.sendMessage(m.chat, {
    react: { text: "📢", key: m.key }
  })

  const quoted = m.quoted
  const mediaMessage = quoted || m
  const mediaType = mediaMessage.mtype

  if (
    ![
      "imageMessage",
      "videoMessage",
      "audioMessage",
      "stickerMessage"
    ].includes(mediaType)
  ) return

  if (
    (mediaType === "audioMessage" || mediaType === "stickerMessage") &&
    !quoted
  ) return

  let rawText = ""
  let finalText = ""

  if (mediaMessage === m) {
    rawText = m.msg?.caption || ""
    finalText = rawText.replace(/^[.]?n(\s|$)/i, "").trim()
  } else {
    rawText = m.text || ""
    finalText =
      rawText.replace(/^[.]?n(\s|$)/i, "").trim() ||
      quoted?.msg?.caption ||
      quoted?.text ||
      ""
  }

  const buffer = await mediaMessage.download?.()
  if (!buffer) return

  const users = [
    ...new Set(participants.map(p => conn.decodeJid(p.id)))
  ]

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

  let msg = { mentions: users }

  if (mediaType === "imageMessage") {
    msg.image = buffer
    if (finalText) msg.caption = finalText
  }

  if (mediaType === "videoMessage") {
    msg.video = buffer
    msg.mimetype = "video/mp4"
    if (finalText) msg.caption = finalText
  }

  if (mediaType === "audioMessage") {
    msg.audio = buffer
    msg.mimetype = "audio/mpeg"
    msg.ptt = false
  }

  if (mediaType === "stickerMessage") {
    msg.sticker = buffer
  }

  await conn.sendMessage(m.chat, msg, { quoted: fkontak })
}

handler.customPrefix = /^[.]?n(\s|$)/i
handler.command = new RegExp()
handler.group = true
handler.admin = true

export default handler
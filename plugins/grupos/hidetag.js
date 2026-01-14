import fetch from "node-fetch"

let thumb = null
fetch("https://files.catbox.moe/mx6p6q.jpg")
  .then(r => r.arrayBuffer())
  .then(b => (thumb = Buffer.from(b)))
  .catch(() => null)

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.fromMe) return

  const quoted = m.quoted
  const mtype = quoted?.mtype
  const text = m.text.replace(/^[.]?n(\s|$)/i, "").trim()

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

  let mediaMessage = quoted || m
  let mediaType = mediaMessage.mtype

  if (!mediaType) return

  if (
    (mediaType === "audioMessage" || mediaType === "stickerMessage") &&
    !quoted
  ) return

  if (
    ![
      "imageMessage",
      "videoMessage",
      "audioMessage",
      "stickerMessage"
    ].includes(mediaType)
  ) return

  const buffer = await mediaMessage.download?.()
  if (!buffer) return

  let msg = { mentions: users }

  if (mediaType === "imageMessage") {
    msg.image = buffer
    msg.caption = text || ""
  }

  if (mediaType === "videoMessage") {
    msg.video = buffer
    msg.caption = text || ""
    msg.mimetype = "video/mp4"
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
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
  const media = quoted || m
  const type = media.mtype

  if (
    ![
      "imageMessage",
      "videoMessage",
      "audioMessage",
      "stickerMessage"
    ].includes(type)
  ) return

  if (
    (type === "audioMessage" || type === "stickerMessage") &&
    !quoted
  ) return

  let finalText = ""

  if (media === m) {
    const caption = m.msg?.caption || ""
    if (!/^[.]?n(\s|$)/i.test(caption)) return
    finalText = caption.replace(/^[.]?n(\s|$)/i, "").trim()
  } else {
    const body = m.text || ""
    if (!/^[.]?n(\s|$)/i.test(body)) return
    finalText =
      body.replace(/^[.]?n(\s|$)/i, "").trim() ||
      quoted?.msg?.caption ||
      quoted?.text ||
      ""
  }

  const buffer = await media.download?.()
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
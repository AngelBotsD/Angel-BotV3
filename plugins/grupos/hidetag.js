import fetch from 'node-fetch'

let thumb = null
fetch('https://files.catbox.moe/mx6p6q.jpg')
  .then(r => r.arrayBuffer())
  .then(b => (thumb = Buffer.from(b)))
  .catch(() => null)

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.fromMe) return

  const content = (m.text || '').trim()
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

  const userText = content.replace(/^\.?n(\s|$)/i, '').trim()
  const quoted = m.quoted
  const mtype = quoted?.mtype

  const caption =
    userText ||
    quoted?.text ||
    '🔊 Notificación'

  try {
    if (quoted && quoted.download && mtype) {
      const stream = await quoted.download()
      const chunks = []

      for await (const chunk of stream) chunks.push(chunk)
      const buffer = Buffer.concat(chunks)

      const msg = { mentions: users }

      if (mtype === 'audioMessage') {
        msg.audio = buffer
        msg.mimetype = 'audio/mpeg'
        msg.ptt = false

        await conn.sendMessage(m.chat, msg, { quoted: fkontak })

        if (userText) {
          await conn.sendMessage(
            m.chat,
            { text: userText, mentions: users },
            { quoted: fkontak }
          )
        }
        return
      }

      if (mtype === 'imageMessage') {
        msg.image = buffer
        msg.caption = caption
      } else if (mtype === 'videoMessage') {
        msg.video = buffer
        msg.caption = caption
        msg.mimetype = 'video/mp4'
      } else if (mtype === 'stickerMessage') {
        msg.sticker = buffer
      } else {
        return conn.sendMessage(
          m.chat,
          { text: caption, mentions: users },
          { quoted: fkontak }
        )
      }

      return conn.sendMessage(m.chat, msg, { quoted: fkontak })
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
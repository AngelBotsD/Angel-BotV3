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

  const userText = content.replace(/^\.?n(\s|$)/i, '').trim()
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

  const quoted = m.quoted
  const type = m.mtype
  const qtype = quoted?.mtype

  if ((type === 'imageMessage' || type === 'videoMessage') && userText) {
    const buffer = await m.download()

    return conn.sendMessage(
      m.chat,
      {
        ...(type === 'imageMessage'
          ? { image: buffer }
          : { video: buffer, mimetype: 'video/mp4' }),
        caption: userText,
        mentions: users
      },
      { quoted: fkontak }
    )
  }

  if (quoted && (qtype === 'imageMessage' || qtype === 'videoMessage') && userText) {
    const buffer = await quoted.download()

    return conn.sendMessage(
      m.chat,
      {
        ...(qtype === 'imageMessage'
          ? { image: buffer }
          : { video: buffer, mimetype: 'video/mp4' }),
        caption: userText,
        mentions: users
      },
      { quoted: fkontak }
    )
  }

  if (quoted && qtype === 'audioMessage') {
    const buffer = await quoted.download()

    return conn.sendMessage(
      m.chat,
      {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        mentions: users
      },
      { quoted: fkontak }
    )
  }

  if (quoted && qtype === 'stickerMessage') {
    const buffer = await quoted.download()

    return conn.sendMessage(
      m.chat,
      {
        sticker: buffer,
        mentions: users
      },
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
let handler = async (m, { conn, participants }) => {
  if (!m.isGroup) return
  if (!m.quoted) return

  const type = m.quoted.mtype
  const isAudio = type === 'audioMessage'
  const isSticker = type === 'stickerMessage'
  const isImage = type === 'imageMessage'
  const isVideo = type === 'videoMessage'

  if (!isAudio && !isSticker && !isImage && !isVideo) return

  await conn.sendMessage(m.chat, {
    react: { text: '🗣️', key: m.key }
  })

  let buffer
  try {
    buffer = await m.quoted.download()
  } catch {
    return
  }
  if (!buffer) return

  const users = participants.map(p => conn.decodeJid(p.id))

  const text =
    m.text.replace(/^\.?n(\s|$)/i, '').trim() ||
    m.quoted.text ||
    ''

  if (isAudio) {
    await conn.sendMessage(
      m.chat,
      { audio: buffer, mimetype: 'audio/mpeg', mentions: users },
      { quoted: m }
    )
    if (text)
      await conn.sendMessage(
        m.chat,
        { text, mentions: users },
        { quoted: m }
      )
    return
  }

  if (isSticker) {
    await conn.sendMessage(
      m.chat,
      { sticker: buffer, mentions: users },
      { quoted: m }
    )
    return
  }

  if (isImage) {
    await conn.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: text || undefined,
        mentions: users
      },
      { quoted: m }
    )
    return
  }

  if (isVideo) {
    await conn.sendMessage(
      m.chat,
      {
        video: buffer,
        caption: text || undefined,
        mimetype: 'video/mp4',
        mentions: users
      },
      { quoted: m }
    )
    return
  }
}

handler.customPrefix = /^\.?n(\s|$)/i
handler.command = new RegExp()
handler.group = true
handler.admin = true

export default handler
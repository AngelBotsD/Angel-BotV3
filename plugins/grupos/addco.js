import fs from 'fs'
import path from 'path'

const jsonPath = path.resolve('./comandos.json')

const getQuotedSticker = (m) => {
  if (!m.quoted) return null
  if (m.quoted.mtype === 'stickerMessage') return m.quoted.msg
  if (m.quoted.message?.stickerMessage) return m.quoted.message.stickerMessage
  return null
}

let handler = async (
  m,
  { conn, args = [], usedPrefix = '.', command = 'addco' }
) => {

  const st = getQuotedSticker(m)

  if (!st) {
    return conn.sendMessage(
      m.chat,
      { text: '❌ Responde a un sticker para asignarle un comando.' },
      { quoted: m }
    )
  }

  const text = args.join(' ').trim()
  if (!text) {
    return conn.sendMessage(
      m.chat,
      {
        text:
          `❌ Debes indicar el comando.\n` +
          `Ejemplo: ${usedPrefix + command} kick`
      },
      { quoted: m }
    )
  }

  if (!fs.existsSync(jsonPath))
    fs.writeFileSync(jsonPath, '{}', 'utf-8')

  const map = JSON.parse(fs.readFileSync(jsonPath, 'utf-8') || '{}')

  const rawSha = st.fileSha256 || st.fileSha256Hash || st.filehash
  if (!rawSha) {
    return conn.sendMessage(
      m.chat,
      { text: '❌ No se pudo obtener el hash del sticker.' },
      { quoted: m }
    )
  }

  let hash
  if (Buffer.isBuffer(rawSha)) {
    hash = rawSha.toString('base64')
  } else if (ArrayBuffer.isView(rawSha)) {
    hash = Buffer.from(rawSha).toString('base64')
  } else {
    hash = rawSha.toString()
  }

  map[m.chat] ||= {}
  map[m.chat][hash] = text
    .toLowerCase()
    .replace(/^[^\w]+/, '')
    .trim()

  fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2))

  await conn.sendMessage(m.chat, {
    react: { text: '✅', key: m.key }
  })

  return conn.sendMessage(
    m.chat,
    {
      text:
        `✅ Sticker vinculado correctamente.\n` +
        `📌 Comando: ${map[m.chat][hash]}\n` +
        `👥 Solo funcionará en este grupo.`
    },
    { quoted: m }
  )
}

handler.command = ['addco']
handler.help = ['addco <comando>']
handler.tags = ['GRUPOS']
handler.admin = true
handler.group = true

export default handler
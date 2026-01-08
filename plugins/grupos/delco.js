import fs from 'fs'
import path from 'path'

const jsonPath = path.resolve('./comandos.json')

export async function handler(m, { conn }) {
  const st =
    m.message?.stickerMessage ||
    m.message?.ephemeralMessage?.message?.stickerMessage ||
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage ||
    m.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage

  if (!st) {
    return conn.sendMessage(m.chat, { text: '❌ Responde a un sticker.' }, { quoted: m })
  }

  if (!fs.existsSync(jsonPath)) {
    return conn.sendMessage(m.chat, { text: '❌ No hay stickers vinculados.' }, { quoted: m })
  }

  const map = JSON.parse(fs.readFileSync(jsonPath, 'utf-8') || '{}')

  const rawSha = st.fileSha256 || st.fileSha256Hash || st.filehash
  if (!rawSha) {
    return conn.sendMessage(m.chat, { text: '❌ No se pudo obtener el hash.' }, { quoted: m })
  }

  let hash
  if (Buffer.isBuffer(rawSha)) hash = rawSha.toString('base64')
  else if (ArrayBuffer.isView(rawSha)) hash = Buffer.from(rawSha).toString('base64')
  else hash = rawSha.toString()

  if (!map[hash] || map[hash].chat !== m.chat) {
    return conn.sendMessage(m.chat, { text: '❌ Ese sticker no está vinculado en este grupo.' }, { quoted: m })
  }

  delete map[hash]
  fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2))

  await conn.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } })
  return conn.sendMessage(m.chat, { text: '✅ Sticker desvinculado correctamente.' }, { quoted: m })
}

handler.command = ['delco']
handler.admin = true
handler.group = true
export default handler
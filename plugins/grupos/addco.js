import fs from 'fs'
import path from 'path'

const jsonPath = path.resolve('./comandos.json')

export async function handler(m, { conn, args, usedPrefix, command }) {
  const quoted =
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
    m.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage

  const st =
    quoted?.stickerMessage ||
    quoted?.ephemeralMessage?.message?.stickerMessage

  if (!st) {
    return conn.reply(m.chat, '❌ Responde a un sticker.', m)
  }

  const cmd = args.join(' ').trim()
  if (!cmd) {
    return conn.reply(
      m.chat,
      `❌ Ejemplo:\n${usedPrefix + command} kick`,
      m
    )
  }

  if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, '{}')
  const map = JSON.parse(fs.readFileSync(jsonPath, 'utf-8') || '{}')

  const rawSha =
    st.fileSha256 ||
    st.fileSha256Hash ||
    st.mediaKey ||
    st.filehash

  if (!rawSha) {
    return conn.reply(m.chat, '❌ No se pudo obtener el hash del sticker.', m)
  }

  const hash = Buffer.isBuffer(rawSha)
    ? rawSha.toString('base64')
    : Buffer.from(rawSha).toString('base64')

  map[hash] = cmd.startsWith('.') ? cmd : '.' + cmd
  fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2))

  await m.react('✅')
  return conn.reply(
    m.chat,
    `✅ Sticker vinculado al comando:\n${map[hash]}`,
    m
  )
}

handler.command = ['addco']
handler.group = true
handler.admin = true

export default handler
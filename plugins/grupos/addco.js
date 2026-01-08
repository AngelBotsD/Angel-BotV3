import fs from 'fs'
import path from 'path'

const jsonPath = path.resolve('./comandos.json')

export async function handler(
  m,
  { conn, args = [], usedPrefix = '.', command = 'addco' }
) {
  const q = m.quoted
  const st =
    q?.sticker ||
    q?.msg?.stickerMessage ||
    (q?.mtype === 'stickerMessage' ? q.msg : null)

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

  let hash
  if (Buffer.isBuffer(rawSha)) hash = rawSha.toString('base64')
  else if (ArrayBuffer.isView(rawSha))
    hash = Buffer.from(rawSha).toString('base64')
  else hash = String(rawSha)

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
import fs from 'fs'
import path from 'path'

const jsonPath = path.resolve('./comandos.json')

export async function handler(m, { conn, args }) {

  // 🔹 Detectar sticker (normalizado por smsg)
  const st =
    m.sticker ||
    m.message?.stickerMessage ||
    m.quoted?.msg?.stickerMessage

  if (!st) {
    return conn.sendMessage(
      m.chat,
      { text: '❌ Responde a un sticker para asignarle un comando.' },
      { quoted: m }
    )
  }

  // 🔹 Obtener comando a asignar
  const text = args.join(' ').trim()
  if (!text) {
    return conn.sendMessage(
      m.chat,
      { text: '❌ Debes indicar el comando.\nEjemplo: .addco kick' },
      { quoted: m }
    )
  }

  // 🔹 Crear JSON si no existe
  if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, '{}')

  const map = JSON.parse(fs.readFileSync(jsonPath, 'utf-8') || '{}')

  // 🔹 Obtener hash del sticker
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
    hash = String(rawSha)
  }

  // 🔹 Guardar comando (forzar prefijo)
  map[hash] = text.startsWith('.') ? text : '.' + text
  fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2))

  // 🔹 Confirmación
  await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
  return conn.sendMessage(
    m.chat,
    { text: `✅ Sticker vinculado al comando: ${map[hash]}` },
    { quoted: m }
  )
}

handler.command = ['addco']
handler.admin = true
handler.group = true
export default handler
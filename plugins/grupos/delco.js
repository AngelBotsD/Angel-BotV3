import fs from "fs"
import path from "path"

const jsonPath = path.resolve("./comandos.json")

export async function handler(m, { conn }) {

  const st =
    m.message?.stickerMessage ||
    m.message?.ephemeralMessage?.message?.stickerMessage ||
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage ||
    m.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage

  if (!st) {
    return conn.sendMessage(
      m.chat,
      { text: "❌ Responde a un sticker para eliminar su comando vinculado." },
      { quoted: m }
    )
  }

  if (!fs.existsSync(jsonPath)) {
    return conn.sendMessage(
      m.chat,
      { text: "❌ No hay stickers vinculados aún." },
      { quoted: m }
    )
  }

  const map = JSON.parse(fs.readFileSync(jsonPath, "utf-8") || "{}")

  const rawSha = st.fileSha256 || st.fileSha256Hash || st.filehash
  if (!rawSha) {
    return conn.sendMessage(
      m.chat,
      { text: "❌ No se pudo obtener el hash del sticker." },
      { quoted: m }
    )
  }

  let hash
  if (Buffer.isBuffer(rawSha)) hash = rawSha.toString("base64")
  else if (ArrayBuffer.isView(rawSha)) hash = Buffer.from(rawSha).toString("base64")
  else hash = rawSha.toString()

  if (!map[m.chat] || !map[m.chat][hash]) {
    return conn.sendMessage(
      m.chat,
      { text: "❌ Este sticker no tiene un comando vinculado en este grupo." },
      { quoted: m }
    )
  }

  delete map[m.chat][hash]

  if (Object.keys(map[m.chat]).length === 0) {
    delete map[m.chat]
  }

  fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2))

  await conn.sendMessage(m.chat, {
    react: { text: "✅", key: m.key }
  })

  return conn.sendMessage(
    m.chat,
    { text: "✅ Comando vinculado al sticker eliminado solo en este grupo." },
    { quoted: m }
  )
}

handler.command = ["delco"]
handler.help = ["𝖣𝖾𝗅𝖼𝗈"];
handler.tags = ["𝖦𝖱𝖴𝖯𝖮𝖲"];
handler.group = true
handler.admin = true

export default handler
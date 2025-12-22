import fs from "fs"
import path from "path"
import axios from "axios"

let stickerPath = path.join(process.cwd(), "media", "grupo.webp")

async function ensureSticker() {
  if (!fs.existsSync(stickerPath)) {
    let { data } = await axios.get("https://cdn.russellxz.click/9b99dd72.webp", {
      responseType: "arraybuffer"
    })
    fs.mkdirSync(path.dirname(stickerPath), { recursive: true })
    fs.writeFileSync(stickerPath, Buffer.from(data))
  }
}

const DIGITS = (s = "") => String(s || "").replace(/\D/g, "")

let handler = async (m, { conn }) => {
  await ensureSticker()

  const chatId = m.chat
  const isGroup = chatId.endsWith("@g.us")
  if (!isGroup) {
    return conn.sendMessage(chatId, { text: "⚠️ Este comando solo funciona en grupos." }, { quoted: m })
  }

  const senderId = m.key.participant || m.sender || ""
  const senderNum = DIGITS(senderId)

  // metadata REAL
  let meta
  try { meta = await conn.groupMetadata(chatId) }
  catch {
    return conn.sendMessage(chatId, { text: "❌ No pude leer la metadata del grupo." }, { quoted: m })
  }

  const participantes = Array.isArray(meta?.participants) ? meta.participants : []

  // ¿Es admin real?
  const isAdmin = participantes.some(p => {
    const ids = [p?.id, p?.jid].filter(Boolean)
    const match = ids.some(id => DIGITS(id) === senderNum)
    const role =
      p?.admin === "admin" ||
      p?.admin === "superadmin" ||
      p?.admin === 1 ||
      p?.isAdmin === true ||
      p?.isSuperAdmin === true
    return match && role
  })

  if (!isAdmin) {
    return conn.sendMessage(chatId, { text: "❌ No eres administrador del grupo." }, { quoted: m })
  }

  let body = m.text?.toLowerCase() || ""
  if (!/(abrir|cerrar|open|close)/.test(body)) return

  let abrir = /(abrir|open)/.test(body)
  let mode = abrir ? "not_announcement" : "announcement"

  await conn.groupSettingUpdate(chatId, mode)

  // sticker
  await conn.sendMessage(chatId, { sticker: fs.readFileSync(stickerPath), quoted: m })

  // reacción
  await conn.sendMessage(chatId, { react: { text: "✅", key: m.key } })
}

handler.help = ["𝖦𝗋𝗎𝗉𝗈 𝖠𝖻𝗋𝗂𝗋", "𝖦𝗋𝗎𝗉𝗈 𝖢𝖾𝗋𝗋𝖺𝗋"]
handler.tags = ["𝖦𝖱𝖴𝖯𝖮𝖲"]
handler.customPrefix = /^(?:\.?grupo\s*(abrir|cerrar|open|close)|\.?(abrir|cerrar|open|close))$/i
handler.command = new RegExp()

export default handler
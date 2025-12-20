import axios from "axios"

const API_BASE = (global.APIs.may || "").replace(/\/+$/, "")
const API_KEY = global.APIKeys.may || ""

const handler = async (m, { conn, text }) => {
  if (!text?.trim()) {
    return conn.sendMessage(
      m.chat,
      { text: "✳️ Usa:\n.brat <texto>" },
      { quoted: m }
    )
  }

  await conn.sendMessage(m.chat, {
    react: { text: "🕒", key: m.key }
  })

  try {
    const res = await axios.get(`${API_BASE}/brat`, {
      params: {
        text,
        apikey: API_KEY
      },
      timeout: 30000,
      validateStatus: () => true
    })

    const data = res.data
    if (data?.status !== true) throw data?.message || "Error API"

    const img = data?.result?.url
    if (!img) throw "Sticker no disponible"

    await conn.sendMessage(
      m.chat,
      {
        sticker: { url: img }
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })

  } catch (e) {
    await conn.sendMessage(
      m.chat,
      { text: `❌ Error: ${e}` },
      { quoted: m }
    )
  }
}

handler.help = ["brat <texto>"]
handler.tags = ["maker"]
handler.command = ["brat"]

export default handler
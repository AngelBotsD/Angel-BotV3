import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys.may || ""

const handler = async (m, { conn, text, usedPrefix, command }) => {

  if (!text)
    return m.reply(`Uso: ${usedPrefix + command} <canción>`)

  await m.react("⏳").catch(() => {})

  try {
    const search = await yts(text)
    if (!search.videos?.length) throw "Sin resultados"

    const video = search.videos[0]

    const { data } = await axios.get(
      `${API_BASE}/ytdl`,
      {
        params: {
          url: video.url,
          type: "Mp3",
          apikey: API_KEY
        }
      }
    )

    if (!data?.status || !data.result?.url)
      throw "No se pudo obtener el audio"

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: data.result.url },
        mimetype: "audio/mpeg"
      },
      { quoted: m }
    )

    await m.react("✅").catch(() => {})

  } catch (e) {
    await m.react("✖️").catch(() => {})
    m.reply(`Error`)
  }
}

handler.command = ["play", "ytplay"]
handler.tags = ["dl"]
handler.help = ["play <texto>"]

export default handler
import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs.may || "").replace(/\/+$/, "")
const API_KEY = global.APIKeys.may || ""

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.chat
  const text = args.join(" ")

  // ===== CLICK EN BOTÓN =====
  if (text.startsWith("audio|") || text.startsWith("video|")) {
    const [type, url] = text.split("|")

    await conn.sendMessage(chatId, {
      react: { text: type === "audio" ? "🎵" : "🎬", key: msg.key }
    })

    try {
      const dlType = type === "audio" ? "Mp3" : "Mp4"
      const { data } = await axios.get(
        `${API_BASE}/ytdl?url=${encodeURIComponent(url)}&type=${dlType}&apikey=${API_KEY}`
      )

      if (!data?.result?.url) throw "No media"

      if (type === "audio") {
        await conn.sendMessage(chatId, {
          audio: { url: data.result.url },
          mimetype: "audio/mpeg"
        }, { quoted: msg })
      } else {
        await conn.sendMessage(chatId, {
          video: { url: data.result.url },
          mimetype: "video/mp4"
        }, { quoted: msg })
      }

    } catch (e) {
      return conn.sendMessage(chatId, { text: "❌ Error al descargar" }, { quoted: msg })
    }

    return
  }

  // ===== SIN TEXTO =====
  if (!text) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa:\n${usedPrefix + command} <canción>`
    }, { quoted: msg })
  }

  await conn.sendMessage(chatId, {
    react: { text: "🕒", key: msg.key }
  })

  const search = await yts(text)
  if (!search.videos.length) {
    return conn.sendMessage(chatId, { text: "❌ Sin resultados" }, { quoted: msg })
  }

  const video = search.videos[0]

  // ===== BOTONES LEGACY =====
  const buttons = [
    {
      buttonId: `${usedPrefix + command} audio|${video.url}`,
      buttonText: { displayText: "🎵 Audio" },
      type: 1
    },
    {
      buttonId: `${usedPrefix + command} video|${video.url}`,
      buttonText: { displayText: "🎬 Video" },
      type: 1
    }
  ]

  await conn.sendMessage(chatId, {
    image: { url: video.thumbnail },
    caption: `🎶 *${video.title}*\n\nSelecciona el formato 👇`,
    footer: "© Angel.xyz",
    buttons,
    headerType: 4
  }, { quoted: msg })
}

handler.command = ["play", "ytplay"]
handler.tags = ["descargas"]
handler.help = ["play <texto>"]

export default handler
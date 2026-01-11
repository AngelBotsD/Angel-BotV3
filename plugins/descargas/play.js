import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs?.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys?.may || ""

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.key.remoteJid
  const query = args.join(" ").trim()

  if (!query) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa:\n${usedPrefix}${command} <nombre de la canción>\nEj:\n${usedPrefix}${command} karma police`
    }, { quoted: msg })
  }

  await conn.sendMessage(chatId, {
    react: { text: "🔎", key: msg.key }
  })

  let video

  try {
    const search = await yts(query)
    if (!search.videos?.length) {
      throw new Error("No se encontraron resultados")
    }
    video = search.videos[0]
  } catch {
    return conn.sendMessage(chatId, {
      text: "❌ No encontré resultados en YouTube."
    }, { quoted: msg })
  }

  let audioUrl

  try {
    const res = await axios.get(`${API_BASE}/ytdl`, {
      params: {
        url: video.url,
        type: "Mp3",
        apikey: API_KEY
      },
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      },
      timeout: 20000
    })

    const data = res.data
    if (!data?.status || !data?.result?.url) {
      throw new Error("No se pudo obtener el audio")
    }

    audioUrl = data.result.url
  } catch (err) {
    return conn.sendMessage(chatId, {
      text: `❌ Error al obtener audio: ${err?.response?.status || ""}`
    }, { quoted: msg })
  }

  const caption = `
⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${video.title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${video.author?.name || "Desconocido"}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${video.timestamp}

» 𝘌𝘕𝘝𝘐𝘈𝘕𝘋𝘖 𝘈𝘜𝘋𝘐𝘖 🎧
`.trim()

  await conn.sendMessage(chatId, {
    audio: { url: audioUrl },
    mimetype: "audio/mpeg",
    fileName: `${video.title}.mp3`,
    caption
  }, { quoted: msg })

  await conn.sendMessage(chatId, {
    react: { text: "✅", key: msg.key }
  })
}

handler.command = ["play"]
handler.help = ["play <texto>"]
handler.tags = ["descargas"]

export default handler
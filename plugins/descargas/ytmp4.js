import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs?.may || "").replace(/\/+$/, "")
const API_KEY = global.APIKeys?.may || ""

function isYouTube(url = "") {
  return /^https?:\/\//i.test(url) &&
    /(youtube\.com|youtu\.be|music\.youtube\.com)/i.test(url)
}

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.key.remoteJid
  const url = args.join(" ").trim()

  if (!url) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa:\n${usedPrefix}${command} <url>\nEj:\n${usedPrefix}${command} https://youtu.be/xxxx`
    }, { quoted: msg })
  }

  if (!isYouTube(url)) {
    return conn.sendMessage(chatId, {
      text: "❌ URL de YouTube inválida."
    }, { quoted: msg })
  }

  await conn.sendMessage(chatId, {
    react: { text: "🕒", key: msg.key }
  })

  let title = "Desconocido"
  let author = "Desconocido"
  let duration = "Desconocida"
  let quality = "—"

  try {
    const id = url.match(/(?:youtu\.be\/|v=|\/shorts\/)([a-zA-Z0-9_-]{11})/)?.[1]
    if (id) {
      const info = await yts({ videoId: id })
      if (info) {
        title = info.title || title
        author = info.author?.name || author
        duration = info.timestamp || duration
      }
    }
  } catch {}

  try {
    const res = await axios.get(
      `${API_BASE}/ytdl`,
      {
        params: {
          url,
          type: "Mp4",
          apikey: API_KEY
        },
        timeout: 20000
      }
    )

    if (typeof res.data !== "object") {
      throw new Error("La API devolvió HTML")
    }

    const videoUrl = res.data?.result?.url
    quality = res.data?.result?.quality || quality

    if (!videoUrl || !/^https?:\/\//i.test(videoUrl)) {
      throw new Error("No se pudo obtener el link MP4")
    }

    const caption = `⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${author}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* ${quality}`

    await conn.sendMessage(chatId, {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption
    }, { quoted: msg })

    await conn.sendMessage(chatId, {
      react: { text: "✅", key: msg.key }
    })

  } catch (err) {
    await conn.sendMessage(chatId, {
      text: `❌ Error: ${err.message || "Fallo interno"}`
    }, { quoted: msg })
  }
}

handler.command = ["ytmp4", "yta4"]
handler.help = ["Ytmp4 <URL>"]
handler.tags = ["descargas"]

export default handler
import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs?.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys?.may || ""

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
    const id = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)?.[1]
    if (id) {
      const info = await yts({ query: `https://www.youtube.com/watch?v=${id}` })
      if (info?.videos?.length) {
        const v = info.videos[0]
        title = v.title || title
        author = v.author?.name || author
        duration = v.timestamp || duration
      }
    }
  } catch {}

  try {
    const res = await axios.get(`${API_BASE}/ytdl`, {
      params: {
        url,
        type: "Mp4",
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
      throw new Error(data?.message || "No se pudo obtener el link de descarga")
    }

    const videoUrl = data.result.url
    quality = data.result.quality || quality

    const caption = `
⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${author}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* ${quality}
`.trim()

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
      text: `❌ Error: ${err?.response?.status || ""} ${err?.message || "Fallo interno"}`
    }, { quoted: msg })
  }
}

handler.command = ["ytmp4", "yta4"]
handler.help = ["𝖸𝗍𝗆𝗉4 <𝖴𝗋𝗅>"]
handler.tags = ["𝖣𝖤𝖲𝖢𝖠𝖱𝖦𝖠𝖲"]

export default handler
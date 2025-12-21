import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys.may || ""

function isYouTube(url = "") {
  return /^https?:\/\//i.test(url) && /(youtube\.com|youtu\.be|music\.youtube\.com)/i.test(url)
}

const handler = async (msg, { conn, text, usedPrefix, command }) => {

  const chatId = msg.key.remoteJid
  const query = String(text || "").trim()

  if (!query) 
    return conn.sendMessage(chatId, { 
      text: `✳️ Usa:\n${usedPrefix}${command} <nombre de canción o url>\nEj:\n${usedPrefix}${command} Lemon Tree` 
    }, { quoted: msg })


  await conn.sendMessage(chatId, { react: { text: "🕒", key: msg.key } })

  let title    = "Desconocido"
  let author   = "Desconocido"
  let duration = "Desconocida"
  let videoUrl = null
  let quality  = "—"
  let videoLink= query

  try {

    if (!isYouTube(query)) {

      const search = await yts(query)
      if (!search?.videos?.length) throw new Error("No se encontró ningún resultado")

      const video = search.videos[0]
      title      = video.title
      author     = video.author?.name || author
      duration   = video.timestamp || duration
      videoLink  = video.url

    } else {

      const videoIdMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
      if (videoIdMatch) {

        const videoUrlFull = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`
        const info = await yts({ query: videoUrlFull })

        if (info?.videos?.length > 0) {
          const video = info.videos[0]
          title      = video.title
          author     = video.author?.name || author
          duration   = video.timestamp || duration
          videoLink  = video.url
        }
      }
    }


    const caption =
`> *𝚈𝚃𝗣𝗟𝗔𝗬 𝗩𝗜𝗗𝗘𝗢*

⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝗹𝗼:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝗋𝗍𝗂𝗌𝗍𝗮:* ${author}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝗋𝗮𝗖𝗂ó𝗇:* ${duration}
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝗹𝗂𝗱𝗮𝗱:* ${quality}
⭒ ִֶָ७ ꯭🌐˙⋆｡ - *𝙰𝗉𝗂:* MayAPI

» 𝙑𝙄𝘿𝙀𝙊 𝙴𝗡𝗩𝗜𝗔𝗗𝗢 🎧  
» 𝘿𝗜𝗦𝗙𝗥𝗨𝗧𝗔𝗟𝗢 𝘾𝗔𝙈𝗣𝗘𝗢𝗡..

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻

> \`\`\`© 𝖯𝗈𝗐𝖾𝗋𝗲𝖽 𝖻𝗒 𝖠𝗇𝗀𝖾𝗅.𝗑𝗒𝗓\`\`\``


    const { data } = await axios.get(`${API_BASE}/ytdl?url=${encodeURIComponent(videoLink)}&type=Mp4&apikey=${API_KEY}`)
    if (!data?.status || !data.result?.url) throw new Error(data?.message || "No se pudo obtener el video")

    videoUrl = data.result.url
    quality  = data.result.quality || quality

    // Enviar video directamente, info dentro del caption
    conn.sendMessage(chatId, { video: { url: videoUrl }, mimetype: "video/mp4", caption }, { quoted: msg })
    conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } })


  } catch (err) {

    console.error("play error:", err)
    conn.sendMessage(chatId, { text: `❌ Error: ${err?.message || "Fallo interno"}` }, { quoted: msg })

  }

}


handler.command = ["play2", "ytplay2"]
handler.help    = ["play <texto o url>"]
handler.tags    = ["descargas"]

export default handler
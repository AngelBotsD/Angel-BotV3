import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys.may || ""

function isYouTube(url = "") {
  return /^https?:\/\//i.test(url) && /(youtube\.com|youtu\.be|music\.youtube\.com)/i.test(url)
}

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.key.remoteJid
  const url = args.join(' ').trim()

  if (!url) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa:\n${usedPrefix}${command} <url>\nEj:\n${usedPrefix}${command} https://youtu.be/xxxx`
    }, { quoted: msg })
  }

  if (!isYouTube(url)) {
    return conn.sendMessage(chatId, { text: "❌ URL de YouTube inválida." }, { quoted: msg })
  }

  await conn.sendMessage(chatId, { react: { text: "🕒", key: msg.key } })

  let title = "Desconocido"
  let artista = "Desconocido"
  let duration = "Desconocida"
  let thumbnail = "https://i.ibb.co/3vhYnV0/default.jpg"

  try {
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
    if (videoIdMatch) {
      const videoUrl = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`
      const info = await yts({ query: videoUrl })
      if (info?.videos?.length > 0) {
        const video = info.videos[0]
        title = video.title || title
        artista = video.author?.name || artista
        duration = video.timestamp || duration
        thumbnail = video.thumbnail || thumbnail
      }
    }
  } catch {}

  let audioUrl
  try {
    const { data } = await axios.get(`${API_BASE}/ytdl?url=${encodeURIComponent(url)}&type=Mp3&apikey=${API_KEY}`)
    if (!data?.status || !data.result?.url) throw new Error(data?.message || "No se pudo obtener el audio")
    audioUrl = data.result.url
  } catch (err) {
    return conn.sendMessage(chatId, { text: `❌ Error al obtener audio: ${err.message}` }, { quoted: msg })
  }

  const infoCaption =`
⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${artista}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}

» 𝘌𝘕𝘝𝘐𝘈𝘕𝘋𝘖 𝘈𝘜𝘋𝘐𝘖  🎧
» 𝘈𝘎𝘜𝘈𝘙𝘋𝘌 𝘜𝘕 𝘗𝘖𝘊𝘖...

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻
`

  await conn.sendMessage(chatId, { image: { url: thumbnail }, caption: infoCaption }, { quoted: msg })
  await conn.sendMessage(chatId, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: false, fileName: `${title}.mp3` }, { quoted: msg })
  await conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } })
}

handler.command  = ["ytmp3", "yta3"]
handler.help     = ["𝖸𝗍𝗆𝗉3 <𝗎𝗋𝗅>"]
handler.tags     = ["𝖣𝖤𝖲𝖢𝖠𝖱𝖦𝖠𝖲"]

export default handler
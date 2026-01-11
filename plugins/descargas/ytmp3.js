import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs?.may || "").replace(//+$/, "")
const API_KEY  = global.APIKeys?.may || ""

function isYouTube(url = "") {
  return /^https?:///i.test(url) &&
    /(youtube.com|youtu.be|music.youtube.com)/i.test(url)
}

const handler = async (msg, { conn, args, usedPrefix, command }) => {
  const chatId = msg.key.remoteJid
  const url = args.join(" ").trim()

  if (!url) {
    return conn.sendMessage(
      chatId,
      {
        text: ✳️ Usa:\n${usedPrefix}${command} <url>\nEj:\n${usedPrefix}${command} https://youtu.be/xxxx
      },
      { quoted: msg }
    )
  }

  if (!isYouTube(url)) {
    return conn.sendMessage(
      chatId,
      {
        text: "❌ URL de YouTube inválida."
      },
      { quoted: msg }
    )
  }

  await conn.sendMessage(chatId, {
    react: { text: "🕒", key: msg.key }
  })

  let title = "Desconocido"
  let artista = "Desconocido"
  let duration = "Desconocida"
  let thumbnail = "https://i.ibb.co/3vhYnV0/default.jpg"

  try {
    const id = url.match(
      /(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
    )?.[1]

    if (id) {
      const info = await yts({
        query: https://www.youtube.com/watch?v=${id}
      })

      if (info?.videos?.length) {
        const v = info.videos[0]
        title = v.title || title
        artista = v.author?.name || artista
        duration = v.timestamp || duration
        thumbnail = v.thumbnail || thumbnail
      }
    }
  } catch {}

  let audioUrl

  try {
    const res = await axios.get(
      ${API_BASE}/ytdl,
      {
        params: {
          url,
          type: "Mp3",
          apikey: API_KEY
        },
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        },
        timeout: 20000
      }
    )

    const data = res.data

    if (!data?.status || !data?.result?.url) {
      throw new Error(data?.message || "No se pudo obtener el audio")
    }

    audioUrl = data.result.url
    title = data.result.title || title

  } catch (err) {
    return conn.sendMessage(
      chatId,
      {
        text: ❌ Error al obtener audio: ${err?.response?.status || ""} ${err?.message || "Fallo interno"}
      },
      { quoted: msg }
    )
  }

  const infoCaption = `
⭒ ִֶָ७ ꯭🎵˙⋆｡ - 𝚃𝚒́𝚝𝚞𝚕𝚘: ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - 𝙰𝚛𝚝𝚒𝚜𝚝𝚊: ${artista}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗: ${duration}

» 𝘌𝘕𝘝𝘐𝘈𝘕𝘋𝘖 𝘈𝘜𝘋𝘐𝘖 🎧
» 𝘈𝘎𝘜𝘈𝘙𝘋𝘌 𝘜𝘕 𝘗𝘖𝘊𝘖...
`.trim()

  await conn.sendMessage(
    chatId,
    {
      image: { url: thumbnail },
      caption: infoCaption
    },
    { quoted: msg }
  )

  await conn.sendMessage(
    chatId,
    {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      ptt: false,
      fileName: ${title}.mp3
    },
    { quoted: msg }
  )

  await conn.sendMessage(chatId, {
    react: { text: "✅", key: msg.key }
  })
}

handler.command = ["ytmp3", "yta3"]
handler.help = ["𝖸𝗍𝗆𝗉3 <𝗎𝗋𝗅>"]
handler.tags = ["𝖣𝖤𝖲𝖢𝖠𝖱𝖦𝖠𝖲"]

export default handler
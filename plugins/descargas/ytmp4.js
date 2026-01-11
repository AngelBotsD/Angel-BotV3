import axios from "axios"
import yts from "yt-search"

function isYouTube(url = "") {
  return /^https?:\/\//i.test(url) && /(youtube\.com|youtu\.be|music\.youtube\.com)/i.test(url)
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

  try {
    const id = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/)?.[1]
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
    const apiUrl = `https://sylphy.xyz/descargar/ytmp4?url=${encodeURIComponent(url)}&q=&api_key=sylphy-zws90tK7OG_1768086161703_xc3t6vvmw`

    const res = await axios.get(apiUrl, {
      timeout: 60000,
      responseType: "text"
    })

    let videoUrl = null

    if (typeof res.data === "string" && res.data.trim().startsWith("{")) {
      const json = JSON.parse(res.data)
      videoUrl = json?.resultado?.url
    }

    if (!videoUrl) {
      videoUrl = apiUrl
    }

    videoUrl = String(videoUrl)

    const caption = `⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${author}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}
`

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
      text: `❌ Error: ${err.message}`
    }, { quoted: msg })
  }
}

handler.command = ["ytmp4", "yta4"]
handler.help = ["𝖸𝗍𝗆𝗉4 <𝖴𝗋𝗅>"]
handler.tags = ["𝖣𝖤𝖲𝖢𝖠𝖱𝖦𝖠𝖲"]

export default handler
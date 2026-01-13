import axios from "axios"

const API_BASE = (global.APIs?.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys?.may || ""

function isYouTube(url = "") {
  return /^https?:\/\//i.test(url) &&
    /(youtube\.com|youtu\.be|music\.youtube\.com)/i.test(url)
}

const handler = async (msg, { conn, args, usedPrefix, command }) => {

  const chatId = msg.key.remoteJid
  const url = args.join(" ").trim()

  if (!url)
    return conn.sendMessage(chatId, {
      text: `✳️ Usa:\n${usedPrefix}${command} <url de YouTube>`
    }, { quoted: msg })

  if (!isYouTube(url))
    return conn.sendMessage(chatId, {
      text: "❌ URL de YouTube inválida."
    }, { quoted: msg })

  await conn.sendMessage(chatId, {
    react: { text: "🕒", key: msg.key }
  })

  let title = "Audio"
  let author = "YouTube"
  let thumbnail = "https://i.ibb.co/3vhYnV0/default.jpg"

  try {
    const { data } = await axios.get(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { timeout: 8000 }
    )

    title = data?.title || title
    author = data?.author_name || author
    thumbnail = data?.thumbnail_url || thumbnail

  } catch {}

  try {

    const res = await axios.get(`${API_BASE}/ytdl`, {
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
    })

    const data = res.data

    if (
      !data ||
      typeof data !== "object" ||
      !data.status ||
      !data.result?.url ||
      !/^https?:\/\//i.test(data.result.url)
    ) {
      throw new Error("La API no devolvió un audio válido")
    }

    const audioUrl = data.result.url
    const cleanTitle = (data.result.title || title)
      .replace(/\.mp3$/i, "")
      .replace(/[\\/:*?"<>|]/g, "")

    const caption = `
⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${cleanTitle}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${author}

» 𝘌𝘕𝘝𝘐𝘈𝘕𝘋𝘖 𝘈𝘜𝘋𝘐𝘖 🎧
`.trim()

    await conn.sendMessage(chatId, {
      image: { url: thumbnail },
      caption
    }, { quoted: msg })

    await conn.sendMessage(chatId, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      fileName: `${cleanTitle}.mp3`,
      ptt: false
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

handler.command = ["ytmp3", "yta3"]
handler.help    = ["ytmp3 <url>"]
handler.tags    = ["descargas"]

export default handler
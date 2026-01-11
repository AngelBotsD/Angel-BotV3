import axios from "axios"
import yts from "yt-search"

const API_BASE = (global.APIs?.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys?.may || ""

const handler = async (msg, { conn, args, usedPrefix, command }) => {

  const chatId = msg.key.remoteJid
  const query = args.join(" ").trim()

  if (!query)
    return conn.sendMessage(chatId, {
      text: `✳️ Usa:\n${usedPrefix}${command} <nombre de canción>\nEj:\n${usedPrefix}${command} Lemon Tree`
    }, { quoted: msg })

  await conn.sendMessage(chatId, {
    react: { text: "🕒", key: msg.key }
  })

  try {

    const search = await yts(query)
    if (!search?.videos?.length)
      throw new Error("No se encontró ningún resultado")

    const video = search.videos[0]

    const title    = video.title
    const author   = video.author?.name || "Desconocido"
    const duration = video.timestamp || "Desconocida"
    const thumb    = video.thumbnail || "https://i.ibb.co/3vhYnV0/default.jpg"
    const videoUrl = video.url

    const caption = `
⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝒊́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${author}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}

» 𝘌𝘕𝘝𝘐𝘈𝘕𝘋𝘖 𝘈𝘜𝘋𝘐𝘖 🎧
`.trim()

    await conn.sendMessage(chatId, {
      image: { url: thumb },
      caption
    }, { quoted: msg })

    const res = await axios.get(`${API_BASE}/ytdl`, {
      params: {
        url: videoUrl,
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
    const cleanTitle = (data.result.title || title).replace(/\.mp3$/i, "")

    axios.get(audioUrl, {
      headers: { Range: "bytes=0-1024" },
      timeout: 4000
    }).catch(() => {})

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
      text: `❌ Error: ${err?.message || "Fallo interno"}`
    }, { quoted: msg })

  }
}

handler.command = ["play", "ytplay"]
handler.help    = ["play <texto>"]
handler.tags    = ["descargas"]

export default handler
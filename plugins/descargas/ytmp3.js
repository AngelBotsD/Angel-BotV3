import axios from "axios"

const API_BASE = (global.APIs.may || "").replace(/\/+$/, "")
const API_KEY  = global.APIKeys.may || ""

function isYouTube(url = "") {
  return /^https?:\/\//i.test(url) && /(youtube\.com|youtu\.be|music\.youtube\.com)/i.test(url)
}

const handler = async (msg, { conn, text, usedPrefix, command }) => {
  const chatId = msg.key.remoteJid

  const url = String(text || "").trim()
  if (!url) {
    return conn.sendMessage(chatId, {
      text: `✳️ Usa:\n${usedPrefix}${command} <url>\nEj:\n${usedPrefix}${command} https://youtu.be/xxxx`
    }, { quoted: msg })
  }

  if (!isYouTube(url)) {
    return conn.sendMessage(chatId, { text: "❌ URL de YouTube inválida." }, { quoted: msg })
  }

  try {
    await conn.sendMessage(chatId, { react: { text: "🕒", key: msg.key } })

    const apiUrl = `${API_BASE}/ytdl?url=${encodeURIComponent(url)}&type=Mp3&apikey=${API_KEY}`
    const { data } = await axios.get(apiUrl)
    if (!data?.status || !data.result?.url) throw new Error(data?.message || "No se pudo obtener el audio")

    const audioUrl = data.result.url
    const thumb = data.result.thumbnail || "https://i.ibb.co/3vhYnV0/default.jpg" // fallback thumbnail

    const infoCaption =
`> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝗅𝗈:* Desconocido
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝗋𝚝𝗂𝚜𝚝𝗮:* Desconocido
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝗋𝗮𝗖𝗂ó𝗇:* Desconocida
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝗅𝗂𝗱𝗮𝗱:* 128kbps
⭒ ִֶָ७ ꯭🌐˙⋆｡ - *𝙰𝗉𝗂:* MayAPI

» 𝙰𝗎𝗗𝗜𝗢 𝙴𝗡𝗩𝗜𝗔𝗗𝗢  🎧
» 𝘿𝗜𝗦𝗙𝗥𝗨𝗧𝗔𝗟𝗢 𝘾𝗔𝗠𝗣𝗘𝗢𝗡..

> \`\`\`© 𝖯𝗈𝗐𝗲𝗋𝗲𝗱 𝖻𝗒 o.𝗑𝗒𝗓\`\`\``

    await conn.sendMessage(chatId, {
      image: { url: thumb },
      caption: infoCaption
    }, { quoted: msg })

    await conn.sendMessage(chatId, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      ptt: false,
      fileName: `${Date.now()}.mp3`
    }, { quoted: msg })

    await conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } })

  } catch (err) {
    console.error("ytmp3 error:", err)
    await conn.sendMessage(chatId, { text: `❌ Error: ${err?.message || "Fallo interno"}` }, { quoted: msg })
  }
}

handler.command  = ["ytmp3", "yta3"]
handler.help     = ["𝖸𝗍𝗆𝗉3 <𝗎𝗋𝗅>"]
handler.tags     = ["𝖣𝖤𝖲𝖢𝖠𝖱𝖦𝖠𝖲"]

export default handler
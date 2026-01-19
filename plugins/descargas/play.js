"use strict"

import axios from "axios"
import yts from "yt-search"

const DOWNLOAD_APIS = [
  {
    name: "api-adonix",
    url: "https://api-adonix.ultraplus.click/download/ytaudio",
    key: "Mikeywilker1"
  },
  {
    name: "ytmp3",
    url: "https://ytmp3.xyz/api/convert"
  }
]

function getText(m) {
  if (!m) return ""
  if (typeof m === "string") return m
  if (m.conversation) return m.conversation
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text
  if (m.message?.conversation) return m.message.conversation
  return ""
}

async function getAudioUrl(url) {
  for (const api of DOWNLOAD_APIS) {
    try {
      const params = new URLSearchParams()
      if (api.name === "api-adonix") {
        params.append("apikey", api.key)
        params.append("url", url)
        const { data } = await axios.post(api.url, params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000
        })
        if (data?.url) return data.url
      } else {
        params.append("format", "mp3")
        params.append("url", url)
        const { data } = await axios.post(api.url, params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000
        })
        if (data?.link) return data.link
      }
    } catch {}
  }

  try {
    const { data } = await axios.get(
      `https://api.tiklydown.eu.org/api/download/audio?url=${encodeURIComponent(url)}`,
      { timeout: 10000 }
    )
    if (data?.url) return data.url
  } catch {}

  return null
}

const handler = async (m, { conn }) => {
  try {
    const chat = m.key.remoteJid
    const text = getText(m.message || m)

    let query = ""
    if (text.startsWith(".play ")) query = text.slice(6).trim()
    else if (text.startsWith(".yt ")) query = text.slice(4).trim()
    else if (text.startsWith(".ytsearch ")) query = text.slice(10).trim()

    if (!query) {
      return conn.sendMessage(chat, { text: "🎵 Uso: .play <canción>" }, { quoted: m })
    }

    await conn.sendMessage(chat, { text: `🔍 Buscando: ${query}` }, { quoted: m })

    const res = await yts(query)
    const video = res.videos?.[0]
    if (!video) {
      return conn.sendMessage(chat, { text: "❌ No se encontraron resultados" }, { quoted: m })
    }

    await conn.sendMessage(
      chat,
      {
        image: { url: video.thumbnail },
        caption: `🎶 ${video.title}\n⏱ ${video.timestamp}\n⬇️ Descargando audio...`
      },
      { quoted: m }
    )

    const audioUrl = await getAudioUrl(video.url)
    if (!audioUrl) throw new Error("No se pudo obtener el audio")

    const audioRes = await axios.get(audioUrl, {
      responseType: "arraybuffer",
      timeout: 60000
    })

    if (audioRes.data.length > 50 * 1024 * 1024) {
      throw new Error("Audio demasiado grande")
    }

    await conn.sendMessage(
      chat,
      {
        audio: audioRes.data,
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${video.title.slice(0, 50)}.mp3`
      },
      { quoted: m }
    )
  } catch (e) {
    await conn.sendMessage(
      m.key.remoteJid,
      { text: `❌ Error: ${e.message || "Error desconocido"}` },
      { quoted: m }
    )
  }
}

handler.command = ["play", "yt", "ytsearch"]
export default handler
import fetch from "node-fetch"
import yts from "yt-search"
import ytdl from "ytdl-core"
import { youtubedl, youtubedlv2 } from "@bochilteam/scraper"

let handler = async (m, { conn, command, args, text, usedPrefix }) => {
  if (!text)
    throw `¿Qué canción quieres descargar?\n\nUso:\n${usedPrefix + command} nombre del video o artista`

  try {
    await m.react("🕓")

    // 🔹 Búsqueda en YouTube
    const yt_play = await search(args.join(" "))
    const video = yt_play[0]
    if (!video) throw "No se encontró ningún video con ese término."

    const v = video.url // URL del video para fallback

    await m.react("✅")

    // 🔹 DESCARGA PRINCIPAL CON SANKA VOLLEREI
    const sanka = await getFromSanka(v)
    const fileName = `${sanitizeFilename(sanka.title || video.title)}.mp3`

    // 🔹 ENVÍO DE AUDIO CON MINIATURA
    await conn.sendMessage(
      m.chat,
      {
        audio: { 
          url: sanka.download 
        },
        mimetype: "audio/mpeg",
        fileName: fileName,
        contextInfo: {
          externalAdReply: {
            title: sanka.title || video.title,
            body: `Duración: ${sanka.duration || video.timestamp}`,
            thumbnailUrl: sanka.thumbnail || video.thumbnail,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    )
  } catch (err) {
    console.log("❌ Error en descarga principal Sanka:", err)
    try {
      // 🔹 Fallback 1 — Bochilteam Scraper
      const yt = await youtubedl(v).catch(async _ => await youtubedlv2(v))
      const dl_url = await yt.audio["128kbps"].download()
      const ttl = await yt.title
      const thumb = await yt.thumbnail

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: dl_url },
          mimetype: "audio/mpeg",
          fileName: `${ttl}.mp3`,
          contextInfo: {
            externalAdReply: {
              title: ttl,
              body: `Duración: ${video?.timestamp || 'N/A'}`,
              thumbnailUrl: thumb,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: m }
      )
    } catch {
      try {
        // 🔹 Fallback 2 — ytdl-core directo
        let info = await ytdl.getInfo(v)
        let format = ytdl.chooseFormat(info.formats, { filter: "audioonly" })
        let thumb = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url

        await conn.sendMessage(
          m.chat,
          { 
            audio: { url: format.url }, 
            mimetype: "audio/mpeg",
            fileName: `${info.videoDetails.title}.mp3`,
            contextInfo: {
              externalAdReply: {
                title: info.videoDetails.title,
                body: `Duración: ${info.videoDetails.lengthSeconds} segundos`,
                thumbnailUrl: thumb,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          },
          { quoted: m }
        )
      } catch (e) {
        m.reply(`⚠️ Error final: ${e.message}`)
      }
    }
  }
}

handler.command = ["pla"]
handler.exp = 0
export default handler

async function search(query, options = {}) {
  const search = await yts.search({ query, hl: "es", gl: "ES", ...options })
  return search.videos
}

function sanitizeFilename(name = "audio") {
  return String(name).replace(/[\\/:*?"<>|]/g, "").slice(0, 200)
}

// 🔹 Función para usar Sanka Vollerei
async function getFromSanka(youtubeUrl) {
  const endpoint = `https://www.sankavollerei.com/download/ytmp3?apikey=planaai&url=${encodeURIComponent(
    youtubeUrl
  )}`
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json().catch(() => null)
  if (!json?.status || !json?.result?.download) {
    throw new Error("Respuesta inválida de Sanka Vollerei")
  }

  return {
    download: json.result.download,
    title: json.result.title,
    duration: json.result.duration,
    thumbnail: json.result.thumbnail
  }
}
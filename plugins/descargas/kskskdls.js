import fetch from "node-fetch"

const key = "dfcb6d76f2f6a9894gjkege8a4ab232222"
const agent = "Mozilla/5.0 (Android 13; Mobile; rv:146.0) Gecko/146.0 Firefox/146.0"
const referer = "https://y2down.cc/enSB/"

const video = ["144", "240", "360", "720", "1080", "1440", "4k"]
const audio = ["mp3", "m4a", "webm", "aacc", "flac", "apus", "ogg", "wav"]

async function ytdl(url, format) {
  if (!video.includes(format) && !audio.includes(format)) {
    return { error: "Invalid format" }
  }

  try {
    const initUrl = `https://p.savenow.to/ajax/download.php?copyright=0&format=${format}&url=${url}&api=${key}`

    const init = await fetch(initUrl, {
      headers: {
        "User-Agent": agent,
        "Referer": referer
      }
    })

    const data = await init.json()
    if (!data.success) return { error: "Failed to start download" }

    const progressUrl = `https://p.savenow.to/api/progress?id=${data.id}`

    while (true) {
      await new Promise(r => setTimeout(r, 2000))

      const response = await fetch(progressUrl, {
        headers: {
          "User-Agent": agent,
          "Referer": referer
        }
      })

      const status = await response.json()

      if (status.progress === 1000) {
        return {
          title: data.title || data.info?.title,
          image: data.info?.image,
          video: data.info?.title,
          link: status.download_url,
          alternatives: status.alternative_download_urls || []
        }
      }
    }
  } catch (e) {
    return { error: e.message }
  }
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const query = args.join(" ").trim()
  if (!query) return m.reply(`Uso: ${usedPrefix + command} <texto>`)

  const res = await ytdl(query, "mp3")
  if (res.error) return m.reply("Error al descargar")

  await conn.sendMessage(
    m.chat,
    {
      audio: { url: res.link },
      mimetype: "audio/mpeg",
      fileName: `${res.title}.mp3`
    },
    { quoted: m }
  )
}

handler.command = ["playa", "ytplaya"]
handler.help = ["playa <texto>"]
handler.tags = ["descargas"]

export default handler
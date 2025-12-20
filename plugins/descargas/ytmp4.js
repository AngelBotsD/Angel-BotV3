import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { pipeline } from "stream"
import { promisify } from "util"

const pipe = promisify(pipeline)
const MAX_SIZE = 60 * 1024 * 1024
const API_KEY = "may-0595dca2"

const handler = async (m, { conn, text }) => {
  if (!text)
    return conn.sendMessage(m.chat, { text: "🎬 Ingresa un link de YouTube" }, { quoted: m })

  if (!/youtu\.?be/.test(text))
    return conn.sendMessage(
      m.chat,
      { text: "⚠️ Solo links de YouTube\n\nEj:\n.ytmp4 https://youtu.be/dQw4w9WgXcQ" },
      { quoted: m }
    )

  await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } })

  try {
    /* ===== INFO VIDEO ===== */
    const info = await yts(text)
    const v = info.videos[0]
    if (!v) throw "No se pudo obtener info del video"

    /* ===== PEDIR A MAYAPI ===== */
    const api = await axios.get(
      `https://mayapi.ooguy.com/ytdl`,
      {
        params: {
          url: text,
          type: "mp4",
          quality: "1080p",
          apikey: API_KEY
        },
        timeout: 60000
      }
    )

    const dlUrl = api.data?.result?.url
    const quality = api.data?.result?.quality || "Desconocida"
    if (!dlUrl) throw "MayAPI no devolvió el video"

    /* ===== DESCARGA STREAM ===== */
    const tmp = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)

    const file = path.join(tmp, `${Date.now()}.mp4`)
    const res = await axios.get(dlUrl, { responseType: "stream" })

    let size = 0
    res.data.on("data", c => {
      size += c.length
      if (size > MAX_SIZE) res.data.destroy()
    })

    await pipe(res.data, fs.createWriteStream(file))

    if (fs.statSync(file).size > MAX_SIZE) {
      fs.unlinkSync(file)
      throw "El video supera los 60MB"
    }

    /* ===== ENVIAR ===== */
    await conn.sendMessage(
      m.chat,
      {
        video: fs.readFileSync(file),
        mimetype: "video/mp4",
        fileName: `${v.title}.mp4`,
        caption: `
> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

🎵 *Título:* ${v.title}
🎤 *Canal:* ${v.author.name}
🕑 *Duración:* ${v.timestamp}
📺 *Calidad:* ${quality}
🌐 *API:* MayAPI

> \`\`\`© powered by hernandez.xyz\`\`\`
        `.trim(),
        supportsStreaming: true
      },
      { quoted: m }
    )

    fs.unlinkSync(file)
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })

  } catch (e) {
    console.error(e)
    conn.sendMessage(m.chat, { text: `❌ Error:\n${e}` }, { quoted: m })
  }
}

handler.command = ["ytmp4"]
export default handler
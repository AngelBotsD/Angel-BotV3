import axios from "axios"
import cheerio from "cheerio"
import yts from "yt-search"

async function y2mateMp3(url) {
  const form = new URLSearchParams()
  form.append("url", url)
  form.append("q_auto", 0)
  form.append("ajax", 1)

  const { data } = await axios.post(
    "https://www.y2mate.com/mates/analyzeV2/ajax",
    form.toString(),
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "user-agent": "Mozilla/5.0"
      }
    }
  )

  const $ = cheerio.load(data.result)
  const vid = $("button").attr("data-id")
  if (!vid) throw "No se pudo obtener el ID"

  const mp3Form = new URLSearchParams()
  mp3Form.append("type", "youtube")
  mp3Form.append("_id", vid)
  mp3Form.append("v_id", vid)
  mp3Form.append("ajax", 1)
  mp3Form.append("token", "")
  mp3Form.append("ftype", "mp3")
  mp3Form.append("fquality", "128")

  const res = await axios.post(
    "https://www.y2mate.com/mates/convertV2/index",
    mp3Form.toString(),
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "user-agent": "Mozilla/5.0"
      }
    }
  )

  if (!res.data?.dlink) throw "No se pudo generar el MP3"
  return res.data.dlink
}

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply("🎧 Escribe el nombre de la canción")

  try {
    const search = await yts(text)
    if (!search.videos.length) return m.reply("❌ No encontré resultados")

    const video = search.videos[0]
    const mp3 = await y2mateMp3(video.url)

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: mp3 },
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`
      },
      { quoted: m }
    )

  } catch (e) {
    console.error(e)
    m.reply("⚠️ Error al descargar el audio")
  }
}

handler.command = ["playa"]
export default handler
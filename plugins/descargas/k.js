import axios from "axios"
import * as cheerio from "cheerio"

const BASE = "https://tubidy.as"

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Safari/537.36"
}

async function searchTubidy(query) {
  const res = await axios.get(
    `${BASE}/search`,
    {
      params: { q: query },
      headers: HEADERS,
      timeout: 20000
    }
  )

  const $ = cheerio.load(res.data)
  const results = []

  $("a").each((_, el) => {
    const href = $(el).attr("href")
    const title = $(el).text().trim()

    if (href && href.startsWith("/download/") && title) {
      results.push({
        title,
        url: BASE + href
      })
    }
  })

  return results
}

async function getMp3(downloadPage) {
  const res = await axios.get(downloadPage, {
    headers: HEADERS,
    timeout: 20000
  })

  const $ = cheerio.load(res.data)
  const link = $("a[href$='.mp3']").attr("href")

  if (!link) return null
  return link.startsWith("http") ? link : BASE + link
}

const handler = async (m, { conn, query, usedPrefix, command }) => {
const query = args.join(" ").trim()
  if (!query)
    return m.reply(`Uso: ${usedPrefix + command} <canción>`)

  await m.react("⏳").catch(() => {})

  try {
    const list = await searchTubidy(query)
    if (!list.length) throw "Sin resultados"

    const mp3 = await getMp3(list[0].url)
    if (!mp3) throw "MP3 no encontrado"

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: mp3 },
        mimetype: "audio/mpeg"
      },
      { quoted: m }
    )

    await m.react("⚡").catch(() => {})
  } catch (e) {
    console.error(e)
    await m.react("✖️").catch(() => {})
    m.reply("Tubidy falló")
  }
}

handler.help = ["tubidy <texto>"]
handler.tags = ["dl"]
handler.command = ["tubidy"]

export default handler
import axios from "axios"
import * as cheerio from "cheerio"

const BASE = "https://mp3juices.cc"

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Referer: BASE
}

async function searchMp3(query) {
  const res = await axios.get(`${BASE}/search/${encodeURIComponent(query)}`, {
    headers: HEADERS,
    timeout: 20000
  })

  const $ = cheerio.load(res.data)
  const results = []

  $("a").each((_, el) => {
    const href = $(el).attr("href")
    const text = $(el).text().trim()

    if (
      href &&
      href.startsWith("http") &&
      href.includes(".mp3") &&
      text.length
    ) {
      results.push({
        title: text,
        url: href
      })
    }
  })

  return results
}

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  const query = (text || args.join(" ")).trim()
  if (!query) return m.reply(`Uso: ${usedPrefix + command} <canción>`)

  await m.react("⏳").catch(() => {})

  try {
    const results = await searchMp3(query)
    if (!results.length) throw "No encontré MP3 disponible"

    const audio = results[0]

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audio.url },
        mimetype: "audio/mpeg"
      },
      { quoted: m }
    )

    await m.react("⚡").catch(() => {})
  } catch (e) {
    console.error("MP3JUICES ERROR:", e)
    await m.react("✖️").catch(() => {})
    m.reply(String(e))
  }
}

handler.help = ["mp3 <texto>"]
handler.tags = ["dl"]
handler.command = ["mp3", "mp3j"]

export default handler
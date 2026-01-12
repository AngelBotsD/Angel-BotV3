import axios from "axios"
import yts from "yt-search"

const CLIENT_ID = "bOhNcaq9F32sB3eS8zWLywAyh4OdDXbC"
const BASE_API_URL = "https://api-v2.soundcloud.com"

const HEADERS = {
  Origin: "https://soundcloud.com",
  Referer: "https://soundcloud.com/",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
}

function cleanTitle(text = "") {
  return text
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/official|video|lyrics|audio|hd|4k/gi, "")
    .replace(/feat\.?|ft\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

async function searchTracks(query) {
  try {
    const res = await axios.get(`${BASE_API_URL}/search/tracks`, {
      headers: HEADERS,
      params: {
        q: query,
        client_id: CLIENT_ID,
        limit: 20,
        app_version: "1695286762",
        app_locale: "en"
      }
    })
    return res.data?.collection || []
  } catch {
    return []
  }
}

async function resolveStreamUrl(transcodingUrl, trackAuthorization) {
  try {
    const res = await axios.get(transcodingUrl, {
      headers: HEADERS,
      params: {
        client_id: CLIENT_ID,
        track_authorization: trackAuthorization
      }
    })
    return res.data?.url || null
  } catch {
    return null
  }
}

function scoreTrack(sc, yt) {
  let score = 0
  const ytDuration = yt.seconds || yt.duration?.seconds || 0
  const scTitle = sc.title.toLowerCase()
  const ytTitle = cleanTitle(yt.title).toLowerCase()

  if (scTitle.includes(ytTitle)) score += 5
  if (ytDuration && Math.abs(sc.duration / 1000 - ytDuration) <= 5) score += 4
  if (!/remix|sped|slowed|nightcore/i.test(scTitle)) score += 2

  return score
}

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  const query = (text || args.join(" ")).trim()
  if (!query) return m.reply(`Uso: ${usedPrefix + command} <canción>`)

  await m.react("⏳").catch(() => {})

  try {
    const ytSearch = await yts(query)
    const yt = ytSearch.videos?.[0]
    if (!yt) throw "No encontré resultados en YouTube"

    const ytTitle = cleanTitle(yt.title)
    const ytAuthor = yt.author?.name || ""
    const scQuery = `${ytTitle} ${ytAuthor}`

    const tracks = await searchTracks(scQuery)
    const candidates = []

    for (const track of tracks) {
      if (track.kind !== "track") continue
      if (!track.track_authorization) continue
      if (!track.media?.transcodings) continue

      const transcoding = track.media.transcodings.find(
        t =>
          t.format.protocol === "progressive" &&
          (t.format.mime_type === "audio/mpeg" ||
            t.format.mime_type === "audio/mp3")
      )

      if (!transcoding) continue

      const url = await resolveStreamUrl(
        transcoding.url,
        track.track_authorization
      )

      if (!url) continue

      candidates.push({
        title: track.title,
        duration: track.duration,
        artwork: track.artwork_url
          ? track.artwork_url.replace("-large", "-t500x500")
          : "",
        permalink: track.permalink_url,
        url,
        score: scoreTrack(track, yt)
      })
    }

    if (!candidates.length) throw "No encontré audio progressive"

    const best = candidates.sort((a, b) => b.score - a.score)[0]

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: best.url },
        mimetype: "audio/mpeg",
        contextInfo: {
          externalAdReply: {
            title: best.title,
            body: "SoundCloud • Progressive Audio",
            thumbnailUrl: best.artwork || undefined,
            sourceUrl: best.permalink,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    )

    await m.react("⚡").catch(() => {})
  } catch (e) {
    console.error("SC ERROR =>", e)
    await m.react("✖️").catch(() => {})
    m.reply(String(e))
  }
}

handler.help = ["soundcloud <texto>"]
handler.tags = ["dl"]
handler.command = ["soundcloud", "sc"]

export default handler
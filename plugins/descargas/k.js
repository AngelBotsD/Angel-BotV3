import axios from 'axios'

const CLIENT_ID = 'bOhNcaq9F32sB3eS8zWLywAyh4OdDXbC'
const BASE_API_URL = 'https://api-v2.soundcloud.com'
const HEADERS = {
  Origin: 'https://soundcloud.com',
  Referer: 'https://soundcloud.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

async function searchTracks(query) {
  try {
    const response = await axios.get(`${BASE_API_URL}/search/tracks`, {
      headers: HEADERS,
      params: {
        q: query,
        client_id: CLIENT_ID,
        limit: 25,
        app_version: '1695286762',
        app_locale: 'en'
      }
    })
    return response.data.collection || []
  } catch {
    return []
  }
}

async function resolveStreamUrl(transcodingUrl, trackAuthorization) {
  try {
    const response = await axios.get(transcodingUrl, {
      headers: HEADERS,
      params: {
        client_id: CLIENT_ID,
        track_authorization: trackAuthorization
      }
    })
    return response.data.url
  } catch {
    return null
  }
}

function scoreTrack(track) {
  let score = 0
  const title = track.title.toLowerCase()

  if (track.playback_count) score += track.playback_count
  if (track.favoritings_count) score += track.favoritings_count * 2
  if (track.reposts_count) score += track.reposts_count * 3

  if (/(remix|live|cover|slowed|reverb|edit|nightcore|mix)/i.test(title))
    score -= 100000

  if (track.duration < 120000 || track.duration > 420000)
    score -= 50000

  return score
}

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  const query = (text || args.join(' ')).trim()
  if (!query) return m.reply(`Uso: ${usedPrefix + command} <búsqueda>`)

  await m.react('⏳').catch(() => {})

  try {
    const tracks = await searchTracks(query)

    const ranked = tracks
      .filter(
        (t) =>
          t.kind === 'track' &&
          t.media &&
          Array.isArray(t.media.transcodings)
      )
      .map((t) => {
        const transcoding = t.media.transcodings.find(
          (x) =>
            x.format.protocol === 'progressive' &&
            x.format.mime_type === 'audio/mpeg'
        )
        if (!transcoding) return null
        return {
          track: t,
          transcoding,
          score: scoreTrack(t)
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)

    if (!ranked.length) {
      await m.react('✖️').catch(() => {})
      return m.reply('No encontré resultados reproducibles.')
    }

    const best = ranked[0]
    const streamUrl = await resolveStreamUrl(
      best.transcoding.url,
      best.track.track_authorization
    )

    if (!streamUrl) {
      await m.react('✖️').catch(() => {})
      return m.reply('No se pudo obtener el audio.')
    }

    const artwork = best.track.artwork_url
      ? best.track.artwork_url.replace('-large', '-t500x500')
      : undefined

    const contextInfo = {
      externalAdReply: {
        title: best.track.title,
        body: 'SoundCloud',
        thumbnailUrl: artwork,
        sourceUrl: best.track.permalink_url,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: streamUrl },
        mimetype: 'audio/mpeg',
        contextInfo
      },
      { quoted: m }
    )

    await m.react('✅').catch(() => {})
  } catch (e) {
    await m.react('✖️').catch(() => {})
    m.reply(`Error: ${e.message || e}`)
  }
}

handler.help = ['soundcloud <query>']
handler.tags = ['dl']
handler.command = ['soundcloud', 'sc']

export default handler
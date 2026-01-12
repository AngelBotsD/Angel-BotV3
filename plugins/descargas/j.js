import fetch from 'node-fetch'
import axios from 'axios'

const apis = {
  delirius: 'https://delirius-apiofc.vercel.app/'
}

const handler = async (m, { conn, command, args, usedPrefix }) => {

  // 📌 Texto después de .spotify
  const query = args.join(' ').trim()

  if (!query) {
    return m.reply(
      `*💽 Ingresa el nombre de alguna canción en Spotify*\n\nEjemplo:\n${usedPrefix + command} Blinding Lights`
    )
  }

  try {
    // ⏳ Reacción de carga
    await conn.sendMessage(m.chat, {
      react: { text: '🕒', key: m.key }
    })

    // 🔍 Buscar en Spotify
    const { data } = await axios.get(
      `${apis.delirius}search/spotify?q=${encodeURIComponent(query)}&limit=10`
    )

    if (!data?.data || data.data.length === 0) {
      throw `_*[ ⚠️ ] No se encontraron resultados para "${query}" en Spotify.*_`
    }

    const song = data.data[0]
    const img = song.image
    const url = song.url

    const info = `> *SPOTIFY DOWNLOADER*\n
🎵 *Título:* ${song.title}
🎤 *Artista:* ${song.artist}
🕒 *Duración:* ${song.duration}
🔗 *Link:* ${url}`

    // 🖼️ Enviar portada
    await conn.sendFile(m.chat, img, 'spotify.jpg', info, m)

    // 🎧 Intento 1 de descarga
    try {
      const api1 = `${apis.delirius}download/spotifydl?url=${encodeURIComponent(url)}`
      const res1 = await fetch(api1)
      const json1 = await res1.json()

      if (!json1?.data?.url) throw 'Fallo API 1'

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: json1.data.url },
          fileName: `${song.title}.mp3`,
          mimetype: 'audio/mpeg'
        },
        { quoted: m }
      )

      await conn.sendMessage(m.chat, {
        react: { text: '✅', key: m.key }
      })

    } catch (e1) {
      // 🎧 Intento 2 de descarga
      try {
        const api2 = `${apis.delirius}download/spotifydlv3?url=${encodeURIComponent(url)}`
        const res2 = await fetch(api2)
        const json2 = await res2.json()

        if (!json2?.data?.url) throw 'Fallo API 2'

        await conn.sendMessage(
          m.chat,
          {
            audio: { url: json2.data.url },
            fileName: `${song.title}.mp3`,
            mimetype: 'audio/mpeg'
          },
          { quoted: m }
        )

        await conn.sendMessage(m.chat, {
          react: { text: '✅', key: m.key }
        })

      } catch (e2) {
        await m.reply(`❌ Error al descargar el audio`)
        console.error(e2)
      }
    }

  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, `❌ Ocurrió un error, intenta nuevamente.`, m)
  }
}

handler.tags = ['downloader']
handler.help = ['spotify <canción>']
handler.command = ['spotify']

export default handler
import fetch from 'node-fetch'
import axios from 'axios'

const handler = async (m, { conn, command, args, usedPrefix }) => {

    const query = args.join(' ').trim()

    if (!query) throw `_*[ ⚠️ ] Agrega lo que quieres buscar*_\n\n_Ejemplo:_\n${usedPrefix + command} Marshmello Moving On`

    try {

        let { data } = await axios.get(
            `https://deliriussapi-oficial.vercel.app/search/spotify?q=${encodeURIComponent(query)}&limit=10`
        )

        if (!data.data || data.data.length === 0) {
            throw `_*[ ⚠️ ] No se encontraron resultados para "${query}" en Spotify.*_`
        }

        const song = data.data[0]
        const img = song.image
        const url = song.url

        const info = `⧁ 𝙏𝙄𝙏𝙐𝙇𝙊
» ${song.title}
﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘
⧁ 𝙋𝙐𝘽𝙇𝙄𝘾𝘼𝘿𝙊
» ${song.publish}
﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘
⧁ 𝗗𝗨𝗥𝗔𝗖𝗜𝗢𝗡
» ${song.duration}
﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘
⧁  𝙋𝙊𝙋𝙐𝙇𝘼𝙍𝙄𝘿𝘼𝘿
» ${song.popularity}
﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘
⧁  𝘼𝙍𝙏𝙄𝙎𝙏𝘼
» ${song.artist}
﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘﹘
⧁ 𝙐𝙍𝙇
» ${url}

_*🎶 Enviando música...*_`.trim()

        await conn.sendFile(m.chat, img, 'imagen.jpg', info, m)

        const apiUrl = `https://deliriussapi-oficial.vercel.app/download/spotifydl?url=${encodeURIComponent(url)}`
        const response = await fetch(apiUrl)
        const result = await response.json()

        if (!result?.data?.url) throw '_*[ ❌ ] Ocurrió un error al descargar el archivo mp3_*'

        const filename = `${result.data.title || 'audio'}.mp3`

        await conn.sendMessage(
            m.chat,
            {
                audio: { url: result.data.url },
                fileName: filename,
                mimetype: 'audio/mpeg',
                caption: `╭━❰  *Spotify* ${filename}`
            },
            { quoted: m }
        )

    } catch (e) {
        await conn.reply(m.chat, `❌ _*Comando Spotify Falló, intenta nuevamente*_`, m)
        console.log(e)
    }
}

handler.tags = ['downloader']
handler.command = ['spotify']
export default handler
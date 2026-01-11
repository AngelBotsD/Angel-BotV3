import yts from 'yt-search'

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const query = args.join(' ').trim()
  if (!query) {
    throw `❗ Por favor ingresa un texto para buscar.\nEjemplo: ${usedPrefix + command} Nombre del video`
  }

  const search = await yts(query)
  const videoInfo = search.videos?.[0]

  if (!videoInfo) {
    throw '❗ No se encontraron resultados para tu búsqueda.'
  }

  const body = `\`\`\`El mejor bot de WhatsApp ⚔️

Elige una opción para descargar:
🎧 Audio o 📽️ Video
\`\`\``

  await conn.sendMessage(
    m.chat,
    {
      text: body,
      footer: '𝕭𝖑𝖆𝖈𝖐 𝕮𝖑𝖔𝖛𝖊𝖗 ☘︎',
      buttons: [
        {
          buttonId: `.ytmp3 ${videoInfo.url}`,
          buttonText: { displayText: '🎧 Audio' },
          type: 1
        },
        {
          buttonId: `.ytmp4 ${videoInfo.url}`,
          buttonText: { displayText: '📽️ Video' },
          type: 1
        },
        {
          buttonId: `.ytmp3doc ${videoInfo.url}`,
          buttonText: { displayText: '💿 Audio Doc' },
          type: 1
        },
        {
          buttonId: `.ytmp4doc ${videoInfo.url}`,
          buttonText: { displayText: '🎥 Video Doc' },
          type: 1
        }
      ],
      headerType: 1
    },
    { quoted: m }
  )

  await m.react('✅')
}

handler.command = ['playa', 'playvid', 'play2']
handler.tags = ['descargas']
handler.group = true
handler.limit = 6

export default handler
import fetch from "node-fetch"

let handler = async (m, { conn, text, command }) => {
  if (!text) {
    return m.reply(
      "🍁 *SoundCloud Play*\n\n" +
      "🌾 Usa:\n" +
      "• `.play alan walker`\n" +
      "• `.play https://soundcloud.com/...`"
    )
  }

  try {
    await m.react("🍄")

    // Scraper SoundCloud
    const url = `https://scrapers.hostrta.win/scraper/33?query=${encodeURIComponent(text)}`
    const res = await fetch(url)
    const json = await res.json()

    if (!json || !json.status || !json.result) {
      return m.reply("❌ No se encontraron resultados.")
    }

    const data = json.result

    let caption =
      `🍁 *SoundCloud*\n\n` +
      `🎵 *Título:* ${data.title}\n` +
      `👤 *Autor:* ${data.author}\n` +
      `⏱ *Duración:* ${data.duration}\n` +
      `🔗 *Link:* ${data.link}\n\n` +
      `> _Author_: *Ryze🐐*`

    // Enviar imagen + audio
    await conn.sendMessage(
      m.chat,
      {
        image: { url: data.thumbnail },
        caption
      },
      { quoted: m }
    )

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: data.audio },
        mimetype: "audio/mpeg"
      },
      { quoted: m }
    )

    await m.react("🌾")

  } catch (e) {
    console.error(e)
    m.reply("❌ Error al reproducir SoundCloud.")
  }
}

handler.help = ["play"]
handler.tags = ["music"]
handler.command = ["play", "sc"]

export default handler
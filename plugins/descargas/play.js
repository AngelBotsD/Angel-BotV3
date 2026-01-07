import fetch from "node-fetch"

let handler = async (
  m,
  { conn, args = [], usedPrefix, command }
) => {
  try {
    await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } })

    // 🔥 Detección de texto (igual que .wm)
    const quotedText =
      m.quoted?.text ||
      m.quoted?.caption ||
      m.quoted?.conversation ||
      ""

    const text = args.join(" ").trim()
    const query = String(text || quotedText || "").trim()

    if (!query) {
      return conn.sendMessage(
        m.chat,
        {
          text:
            "🍁 *SoundCloud*\n\n" +
            "🌾 Usa:\n" +
            `• ${usedPrefix + command} alan walker\n` +
            `• Responde a un texto con ${usedPrefix + command}`
        },
        { quoted: m }
      )
    }

    // Scraper SoundCloud (33)
    const url = `https://scrapers.hostrta.win/scraper/33?query=${encodeURIComponent(query)}`
    const res = await fetch(url)
    const json = await res.json()

    if (!json?.status || !json?.result) {
      return m.reply("❌ No se encontraron resultados.")
    }

    const data = json.result

    let caption =
      `🍁 *SoundCloud*\n\n` +
      `🎵 *Título:* ${data.title}\n` +
      `👤 *Autor:* ${data.author}\n` +
      `⏱ *Duración:* ${data.duration}\n` +
      `🔗 *Link:* ${data.link}\n\n` +
      `> _Author_: *Angel🐐*`

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

    await conn.sendMessage(m.chat, { react: { text: "🎵", key: m.key } })

  } catch (e) {
    console.error(e)
    m.reply("❌ Error al reproducir desde SoundCloud.")
  }
}

handler.help = ["play <texto>"]
handler.tags = ["music"]
handler.command = ["play", "sc"]

export default handler
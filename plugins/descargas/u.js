import yts from "yt-search"
import fetch from "node-fetch"

const handler = async (m, { conn, text, usedPrefix, command }) => {

  // 🔹 FIX REAL: reconstruir texto si viene vacío
  const query =
    text?.trim() ||
    m.text?.slice((usedPrefix + command).length).trim()

  if (!query) {
    return m.reply("🎶 Ingresa el nombre del video de YouTube.")
  }

  try {
    let url = query
    let title = "Desconocido"
    let authorName = "Desconocido"
    let durationTimestamp = "Desconocida"
    let views = "Desconocidas"
    let thumbnail = ""

    // 🔹 búsqueda si no es link
    if (!/^https?:\/\//i.test(query)) {
      const res = await yts(query)
      if (!res?.videos?.length) {
        return m.reply("🚫 No encontré resultados.")
      }

      const video = res.videos[0]
      title = video.title
      authorName = video.author?.name || "Desconocido"
      durationTimestamp = video.timestamp || "Desconocida"
      views = video.views || 0
      url = video.url
      thumbnail = video.thumbnail
    }

    const vistas = formatViews(views)

    // 🔹 thumbnail fake contacto
    const res3 = await fetch("https://files.catbox.moe/wfd0ze.jpg")
    const thumb3 = Buffer.from(await res3.arrayBuffer())

    const fkontak = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        documentMessage: {
          title: `『 ${title} 』`,
          fileName: global.botname || "Shadow Bot",
          jpegThumbnail: thumb3
        }
      }
    }

    const caption = `
✧━───『 𝙸𝚗𝚏𝚘 𝚍𝚎𝚕 𝚅𝚒𝚍𝚎𝚘 』───━✧

🎼 𝑻𝒊́𝒕𝒖𝒍𝒐: ${title}
📺 𝑪𝒂𝒏𝒂𝒍: ${authorName}
👁️ 𝑽𝒊𝒔𝒕𝒂𝒔: ${vistas}
⏳ 𝑫𝒖𝒓𝒂𝒄𝒊𝒐́𝒏: ${durationTimestamp}
🌐 𝑬𝒏𝒍𝒂𝒄𝒆: ${url}

✧━───『 𝑺𝒉𝒂𝒅𝒐𝒘 𝑩𝒐𝒕 』───━✧
⚡ 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝒀𝒐𝒔𝒖𝒆 ⚡
`

    await conn.sendMessage(
      m.chat,
      {
        image: thumb,
        caption,
        footer: "⚡ Shadow — Descargas rápidas ⚡",
        buttons: [
          {
            buttonId: `shadowaudio ${url}`,
            buttonText: { displayText: "🎵 𝘿𝙚𝙨𝙘𝙖𝙧𝙜𝙖𝙧 𝘼𝙪𝙙𝙞𝙤" },
            type: 1
          },
          {
            buttonId: `shadowvideo ${url}`,
            buttonText: { displayText: "🎬 𝘿𝙚𝙨𝙘𝙖𝙧𝙜𝙖𝙧 𝙑𝙞𝙙𝙚𝙤" },
            type: 1
          }
        ],
        headerType: 4
      },
      { quoted: fkontak }
    )


  } catch (e) {
    console.error(e)
    m.reply("❌ Error: " + e.message)
  }
}

handler.before = async (m, { conn }) => {
  const selected = m?.message?.buttonsResponseMessage?.selectedButtonId
  if (!selected) return

  const [cmd, ...rest] = selected.split(" ")
  const url = rest.join(" ")

  if (cmd === "shadowaudio") {
    return downloadMedia(conn, m, url, "mp3")
  }

  if (cmd === "shadowvideo") {
    return downloadMedia(conn, m, url, "mp4")
  }
}

const fetchBuffer = async (url) => {
  const res = await fetch(url)
  return res.buffer()
}

const downloadMedia = async (conn, m, url, type) => {
  try {
    const sent = await conn.sendMessage(
      m.chat,
      { text: type === "mp3" ? "🎵 Descargando audio..." : "🎬 Descargando video..." },
      { quoted: m }
    )

    const api = type === "mp3"
      ? `https://api-adonix.ultraplus.click/download/ytaudio?url=${encodeURIComponent(url)}&apikey=SHADOWKEYBOTMD`
      : `https://api-adonix.ultraplus.click/download/ytvideo?url=${encodeURIComponent(url)}&apikey=SHADOWKEYBOTMD`

    const r = await fetch(api)
    const json = await r.json()

    if (!json?.status || !json?.data?.url) {
      return m.reply("🚫 No se pudo descargar el archivo.")
    }

    const fileUrl = json.data.url
    const title = cleanName(json.data.title || "media")

    if (type === "mp3") {
      const audio = await fetchBuffer(fileUrl)
      await conn.sendMessage(
        m.chat,
        { audio, mimetype: "audio/mpeg", fileName: title + ".mp3" },
        { quoted: m }
      )
    } else {
      await conn.sendMessage(
        m.chat,
        { video: { url: fileUrl }, mimetype: "video/mp4", fileName: title + ".mp4" },
        { quoted: m }
      )
    }

    await conn.sendMessage(
      m.chat,
      { text: `✅ Descarga completada\n\n🎼 Título: ${title}`, edit: sent.key }
    )


  } catch (e) {
    console.error(e)
    m.reply("❌ Error: " + e.message)
  }
}

const cleanName = (name) =>
  name.replace(/[^\w\s-_.]/gi, "").slice(0, 50)

const formatViews = (views) => {
  if (!views) return "No disponible"
  if (views >= 1e9) return (views / 1e9).toFixed(1) + "B"
  if (views >= 1e6) return (views / 1e6).toFixed(1) + "M"
  if (views >= 1e3) return (views / 1e3).toFixed(1) + "K"
  return views.toString()
}

handler.command = ["playa", "yta", "ytsearch"]
handler.tags = ["descargas"]

export default handler
const handler = async (m, { conn }) => {

  const q = m.quoted
  if (!q) {
    return conn.sendMessage(
      m.chat,
      { text: "❌ Responde al mensaje que deseas eliminar." },
      { quoted: m }
    )
  }

  try {
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: q.fromMe || false,
        id: q.id,
        participant: q.sender || undefined
      }
    })

    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: m.fromMe || false,
        id: m.id,
        participant: m.sender || undefined
      }
    })

  } catch (e) {
    await conn.sendMessage(
      m.chat,
      { text: "❌ No se pudo eliminar el mensaje." },
      { quoted: m }
    )
  }
}

handler.help = ["𝖣𝖾𝗅𝖾𝗍𝖾"]
handler.tags = ["𝖦𝖱𝖴𝖯𝖮𝖲"]
handler.customPrefix = /^\.?(del|delete)$/i
handler.command = new RegExp()
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
const handler = async (m, { conn }) => {
  const chat = m.chat

  // 🔗 reacción inmediata
  await conn.sendMessage(chat, {
    react: { text: "🔗", key: m.key }
  })

  try {
    // ⏳ cargar TODO primero
    const [meta, inviteCode] = await Promise.all([
      conn.groupMetadata(chat),
      conn.groupInviteCode(chat).catch(() => null)
    ])

    // 🔎 detect link
    if (!inviteCode) {
      return m.reply("❌ No pude obtener el enlace del grupo.\n¿Soy admin?")
    }

    const groupName = meta?.subject || "Grupo"
    const link = `https://chat.whatsapp.com/${inviteCode}`

    // 🧠 mensaje final (vista previa automática)
    const text = `🔗 *Enlace del grupo*\n\n*${groupName}*\n${link}`

    await conn.sendMessage(chat, { text }, { quoted: m })

  } catch (e) {
    console.error("Error .link:", e)
    m.reply("⚠️ Ocurrió un error al generar el enlace.")
  }
}

handler.help = ["link"]
handler.tags = ["grupos"]
handler.command = /^\.?link$/i
handler.group = true

export default handler
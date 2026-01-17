const handler = async (m, { conn }) => {
  const chat = m.chat

  // reacción inmediata
  await conn.sendMessage(chat, {
    react: { text: "🔗", key: m.key }
  })

  try {
    // esperar a que todo cargue
    const inviteCode = await conn.groupInviteCode(chat).catch(() => null)

    if (!inviteCode) {
      return m.reply("❌ No pude obtener el enlace del grupo.\n¿Soy admin?")
    }

    const link = `https://chat.whatsapp.com/${inviteCode}`

    // ⚠️ IMPORTANTE:
    // SOLO el link, sin texto extra
    await conn.sendMessage(chat, {
      text: link
    }, { quoted: m })

  } catch (e) {
    console.error("Error .link:", e)
  }
}

handler.help = ["link"]
handler.tags = ["grupos"]
handler.command = /^\.?link$/i
handler.group = true

export default handler
const handler = async (m, { conn, args, participants }) => {

  let notifyText = ""

  // 1️⃣ Texto escrito después de .n
  if (args.length > 0) {
    notifyText = args.join(" ").trim()
  }

  // 2️⃣ Si no hay args, usar texto citado
  else if (m.quoted && m.quoted.text) {
    notifyText = m.quoted.text.trim()
  }

  // 3️⃣ Validación final
  if (!notifyText) {
    return conn.sendMessage(
      m.chat,
      { text: "❌ Usa `.n texto` o responde a un mensaje con `.n`" },
      { quoted: m }
    )
  }

  // 4️⃣ Menciones (notificación real)
  const mentions = participants.map(p => p.id)

  await conn.sendMessage(m.chat, {
    text: notifyText,
    mentions
  })
}

handler.command = /^n$/i
handler.group = true

export default handler
const handler = async (m, { conn, args, participants = [] }) => {

  let notifyText = ""

  // 1️⃣ Texto escrito después de .n
  if (args.length > 0) {
    notifyText = args.join(" ").trim()
  }

  // 2️⃣ Texto citado (SOLO si es texto real)
  else if (
    m.quoted &&
    typeof m.quoted.text === "string" &&
    m.quoted.text.trim()
  ) {
    notifyText = m.quoted.text.trim()
  }

  // 3️⃣ Si no hay texto válido → diálogo
  if (!notifyText) {
    return conn.sendMessage(
      m.chat,
      {
        text:
          "❌ *Uso incorrecto del comando*\n\n" +
          "• `.n texto`\n" +
          "• Responde a un mensaje de texto con `.n`"
      },
      { quoted: m }
    )
  }

  // 4️⃣ Validación de grupo
  if (!participants.length) {
    return conn.sendMessage(
      m.chat,
      { text: "❌ No se pudieron obtener los participantes del grupo." },
      { quoted: m }
    )
  }

  // 5️⃣ Notificación real
  const mentions = participants.map(p => p.id)

  await conn.sendMessage(m.chat, {
    text: notifyText,
    mentions
  })
}

handler.command = /^n$/i
handler.group = true

export default handler
const handler = async (m, { conn, text, participants }) => {

  let notifyText = ""

  // 1️⃣ Si escribió texto después de .n
  if (text && text.trim()) {
    notifyText = text.trim()
  }

  // 2️⃣ Si NO escribió texto, pero respondió a un mensaje
  else if (m.quoted && m.quoted.text) {
    notifyText = m.quoted.text.trim()
  }

  // 3️⃣ Si no hay nada válido
  if (!notifyText) {
    return conn.sendMessage(m.chat, {
      text: "❌ Usa `.n texto` o responde a un mensaje con `.n`"
    }, { quoted: m })
  }

  // 4️⃣ Construimos menciones
  const mentions = participants.map(p => p.id)

  // 5️⃣ Enviamos notificación
  await conn.sendMessage(m.chat, {
    text: notifyText,
    mentions
  })

}

handler.command = /^n$/i
handler.group = true

export default handler
let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return conn.reply(
      m.chat,
      '✳️ Uso correcto:\n*.wa 521XXXXXXXXXX*',
      m
    )
  }

  let number = args[0].replace(/\D/g, '')
  if (number.length < 8) {
    return conn.reply(m.chat, '❌ Número inválido', m)
  }

  let jid = number + '@s.whatsapp.net'

  try {
    let result = await conn.onWhatsApp(jid)

    if (!result || !result[0] || !result[0].exists) {
      return conn.reply(
        m.chat,
`📛 *Estado del número*

❌ *NO registrado en WhatsApp*

ℹ️ Este estado ocurre cuando un número:
• Entra en revisión temporal
• Entra en revisión permanente
• Es baneado
• Nunca fue activado

⚠️ Para WhatsApp Web / Baileys
todos estos estados se muestran igual.`,
        m
      )
    }

    return conn.reply(
      m.chat,
`✅ *Número activo en WhatsApp*

👤 JID:
${jid}`,
      m
    )

  } catch (e) {
    console.error(e)
    return conn.reply(
      m.chat,
      '⚠️ Error al verificar el número',
      m
    )
  }
}

handler.help = ['wa <numero>']
handler.tags = ['tools']
handler.command = /^wa$/i
handler.owner = true // opcional

export default handler
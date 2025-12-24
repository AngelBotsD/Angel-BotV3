let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return conn.reply(m.chat, '✳️ Usa:\n.wa 521XXXXXXXXXX', m)
  }

  // limpiar número
  let number = args[0].replace(/\D/g, '')
  if (number.length < 8) {
    return conn.reply(m.chat, '❌ Número inválido', m)
  }

  let jid = number + '@s.whatsapp.net'

  try {
    let res = await conn.onWhatsApp(jid)

    if (!res || res.length === 0 || !res[0]?.exists) {
      return conn.reply(
        m.chat,
        `❌ *Número NO registrado en WhatsApp*\n\n📛 Posible baneo permanente o número inexistente`,
        m
      )
    }

    return conn.reply(
      m.chat,
      `✅ *Número activo en WhatsApp*\n\n👤 JID: ${jid}`,
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
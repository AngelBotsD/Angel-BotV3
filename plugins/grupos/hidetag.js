const handler = async (m, { command, args }) => {
  if (command !== 'n') return

  if (!m.hasCommandText)
    return m.reply('❌ No se puede usar .n en stickers ni audios')

  let value = args.join(' ').trim()

  // 1️⃣ texto citado
  if (!value && m.quoted?.text) {
    value = m.quoted.text.trim()
  }

  // 2️⃣ último texto válido del chat
  if (!value) {
    const last = global.lastTextMessage?.get(m.chat)
    if (last?.text) {
      value = last.text.trim()
    }
  }

  if (!value)
    return m.reply('❌ Usa .n <texto> o responde a un mensaje con texto')

  let from = 'texto'
  if (m.isImage) from = 'imagen'
  else if (m.isVideo) from = 'video'
  else if (m.isDocument) from = 'documento'
  else if (m.quoted) from = 'respuesta'

  await m.reply(
    `✅ .n detectado\n\n📌 Texto: ${value}\n📦 Origen: ${from}`
  )
}

handler.command = ['n']
export default handler
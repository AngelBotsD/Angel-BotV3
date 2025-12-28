let handler = async (m, { conn }) => {}

handler.all = async function (m) {
  const mentioned =
    m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

  if (!mentioned.includes(this.user.jid)) return

  await m.reply("hola si")
}

export default handler
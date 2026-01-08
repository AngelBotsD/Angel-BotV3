var handler = async (m, { conn, args }) => {

  let text = args.join(' ')
  if (!text)
    return conn.reply(
      m.chat,
      `🎌 *Escribe dos nombres o menciona a dos personas*\n\nEjemplo:\n• ship Juan María\n• ship @user1 @user2`,
      m
    )

  let mentioned = m.mentionedJid || []

  let name1, name2

  if (mentioned.length >= 2) {
    name1 = await conn.getName(mentioned[0])
    name2 = await conn.getName(mentioned[1])
  } else if (mentioned.length === 1) {
    let resto = text.replace(/@\d+/g, '').trim()
    if (!resto)
      return conn.reply(m.chat, `🚩 *Falta la segunda persona*`, m)

    name1 = await conn.getName(mentioned[0])
    name2 = resto
  } else {
    let [t1, ...t2] = text.split(' ')
    name1 = t1
    name2 = t2.join(' ')
    if (!name2)
      return conn.reply(m.chat, `🚩 *Escribe el nombre de la segunda persona*`, m)
  }

  let lovePercent = Math.floor(Math.random() * 100)

  let loveMsg = `❤️ *${name1}* y *${name2}*\n\n✨ Su porcentaje de amor es de *${lovePercent}%* 👩🏻‍❤️‍👨🏻`

  await conn.sendMessage(
    m.chat,
    {
      text: loveMsg,
      mentions: mentioned
    },
    { quoted: m }
  )
}

handler.help = ['ship']
handler.tags = ['fun']
handler.command = /^ship$/i

export default handler
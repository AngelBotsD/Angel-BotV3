let handler = async (m, { conn }) => {

  // contador por usuario
  conn.packCount = conn.packCount || {}
  let user = m.sender
  conn.packCount[user] = (conn.packCount[user] || 0) + 1

  let img = 'https://delirius-apiofc.vercel.app/nsfw/girls'
  let txt = `*Pack 🔥*\n\n👤 Usuario: @${user.split('@')[0]}\n📦 Packs vistos: ${conn.packCount[user]}`

  let msg = {
    image: { url: img },
    caption: txt,
    footer: 'Angel Bot 😈',
    mentions: [user],
    interactiveButtons: [
      {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: 'Ver más 🔥',
          id: '.pack'
        })
      }
    ]
  }

  await conn.sendMessage(m.chat, msg, { quoted: m })
}

handler.command = ['pack']
export default handler
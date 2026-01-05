import fs from 'fs'

let handler = async (m, { conn, args }) => {

  await conn.sendMessage(m.chat, { react: { text: '🔥', key: m.key } })

  let d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }))
  let locale = 'es'
  let week = d.toLocaleDateString(locale, { weekday: 'long' })
  let date = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  let hourNow = d.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace('a. m.', 'A.M').replace('p. m.', 'P.M')

  let userId = m.mentionedJid?.[0] || m.sender
  let user = global.db.data.users[userId]
  let name = conn.getName(userId)

  let _uptime = process.uptime() * 1000
  let uptime = clockString(_uptime)

  let categories = {}
  for (let plugin of Object.values(global.plugins)) {
    if (!plugin.help || !plugin.tags) continue
    for (let tag of plugin.tags) {
      if (!categories[tag]) categories[tag] = []
      categories[tag].push(...plugin.help.map(cmd => `.${cmd}`))
    }
  }

  let menuText = `
\`\`\`${week}, ${date}
${hourNow} 𝖬𝖾𝗑𝗂𝖼𝗈 𝖢𝗂𝗍𝗒\`\`\`

👋🏻 Hola @${userId.split('@')[0]} 𝖬𝖾 𝖫𝗅𝖺𝗆𝗈 𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍, 𝖤𝗌𝗉𝖾𝗋𝗈 𝖰𝗎𝖾 𝖲𝖾𝖺 𝖣𝖾 𝖬𝗎𝖼𝗁𝖺 𝖴𝗍𝗂𝗅𝗂𝖽𝖺𝖽 🏞️

𝖳𝗂𝖾𝗆𝗉𝗈 𝖠𝖼𝗍𝗂𝗏𝗈: ${uptime} 🏞️
`.trim()

  for (let [tag, cmds] of Object.entries(categories)) {
    let tagName = tag.toUpperCase().replace(/_/g, ' ')
    menuText += `

╭─── ${tagName} ──╮
${cmds.map(cmd => `⭒ ִֶָ७ ꯭🚩˙⋆｡ - ${cmd}`).join('\n')}
╰──────────╯`
  }

  await conn.sendMessage(
    m.chat,
    {
      image: { url: "https://files.catbox.moe/u1lwcu.jpg" },
      caption: menuText,
      buttons: [
        {
          buttonId: '.owner',
          buttonText: { displayText: '👑 Owner' },
          type: 1
        },
        {
          buttonId: '.ping',
          buttonText: { displayText: '📡 Ping' },
          type: 1
        }
      ],
      headerType: 4,
      contextInfo: {
        mentionedJid: [userId]
      }
    },
    { quoted: m }
  )
}

handler.command = ['menu', 'menú', 'help', 'ayuda']

export default handler

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${h}h ${m}m ${s}s`
}
import fs from 'fs'

let handler = async (m, { conn }) => {

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

  // 👉 Comandos con .
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

👋🏻 Hola @${userId.split('@')[0]}, mi nombre es Angel Bot, espero que te sea de mucha utilidad 🏞️.

Tiempo que he estado activo: ${uptime} 🏞️
`.trim()

  for (let [tag, cmds] of Object.entries(categories)) {
    let tagName = tag.toUpperCase().replace(/_/g, ' ')
    menuText += `

╭─── ${tagName} ──╮
${cmds.map(cmd => `⭒ 🔳 - ${cmd}`).join('\n')}
╰──────────╯`
  }

  // ✅ Botón Owner
  const buttons = [
    {
      buttonId: '.owner',
      buttonText: { displayText: 'Owner' },
      type: 1
    }
  ]

  await conn.sendMessage(
    m.chat,
    {
      video: { url: "https://cdn.russellxz.click/cbb1d265.mp4" },
      caption: menuText,
      buttons,
      headerType: 4,
      gifPlayback: true
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
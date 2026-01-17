var handler = async (m, { conn }) => {
  let group = m.chat
  let code = await conn.groupInviteCode(group)
  let link = 'https://chat.whatsapp.com/' + code

  await conn.sendMessage(
    m.chat,
    { text: link },
    { quoted: m }
  )
}

handler.help = ['link']
handler.tags = ['grupo']
handler.command = ['link', 'enlace']
handler.group = true

export default handler
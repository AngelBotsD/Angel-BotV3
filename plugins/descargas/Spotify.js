let handler = async (m, { conn }) => {
  const text = `Hola 👋\nElige una opción`

  const buttons = [
    { buttonId: '.owner', buttonText: { displayText: 'Owner' }, type: 1 },
    { buttonId: '.menu', buttonText: { displayText: 'Menu' }, type: 1 }
  ]

  await conn.sendMessage(m.chat, {
    text,
    buttons,
    footer: 'Selecciona una opción',
    headerType: 1
  }, { quoted: m })
}

handler.command = ['xd']
export default handler
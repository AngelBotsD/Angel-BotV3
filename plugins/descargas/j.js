import pkg from 'baileys_helper'
const { sendButtons } = pkg

const handler = async (m, { conn }) => {

  // 🔘 Si viene de botón
  if (m.isButton) {

    if (m.text === 'menu_btn') {
      // 🔥 ejecuta .menu REAL
      m.text = '.menu'
      return
    }

    if (m.text === 'owner_btn') {
      // 🔥 ejecuta .owner REAL
      m.text = '.owner'
      return
    }

    return
  }

  // 👋 .hola normal
  await sendButtons(conn, m.chat, {
    text: '👋 Hola, elige una opción:',
    footer: 'Angel Bot',
    buttons: [
      { id: 'menu_btn', text: 'Menu' },
      { id: 'owner_btn', text: 'Owner' }
    ]
  })
}

handler.command = ['hola']
export default handler
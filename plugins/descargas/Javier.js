import pkg from 'baileys_helper'
const { sendButtons } = pkg

const handler = async (m, { conn }) => {
  await sendButtons(conn, m.chat, {
    text: '👋 Hola, elige una opción:',
    footer: 'Angel Bot',
    buttons: [
      { id: 'menu', text: '📋 Menu' },
      { id: 'owner', text: '👑 Owner' }
    ]
  }, { quoted: m })
}

handler.command = ['hola']
export default handler
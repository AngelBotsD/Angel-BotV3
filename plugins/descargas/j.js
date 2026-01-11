import pkg from 'baileys_helper'
const { sendButtons } = pkg

export async function all(m) {
  if (!m.isButton) return

  if (m.text === 'link_btn') {
    m.text = 'linl'
  }

  if (m.text === 'owner_btn') {
    m.text = '.owner'
  }
}

const handler = async (m, { conn }) => {
  await sendButtons(conn, m.chat, {
    text: '👋 Hola, elige una opción:',
    footer: 'Angel Bot',
    buttons: [
      { id: 'link_btn', text: 'link' },
      { id: 'owner_btn', text: 'Owner' }
    ]
  })
}

handler.command = ['hola']
export default handler
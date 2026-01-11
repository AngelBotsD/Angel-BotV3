import { sendButtons } from '../../lib/miniButtons.js'

const handler = async (m, { conn }) => {
  await sendButtons(
    conn,
    m.chat,
    '👋 Hola, elige una opción:',
    'Angel Bot',
    [
      { text: 'Menu', id: '.menu' },
      { text: 'Owner', id: '.owner' }
    ],
    m
  )
}

handler.command = ['hola']
export default handler
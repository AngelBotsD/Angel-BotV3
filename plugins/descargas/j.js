const handler = async (m, { conn }) => {
  await sendButtons(conn, m.chat, {
    text: '🧪 Prueba de botones',
    footer: 'Bot test',
    buttons: [
      { id: 'btn_1', text: 'Opción 1' },
      { id: 'btn_2', text: 'Opción 2' }
    ]
  })
}

handler.command = ['tnf']
export default handler
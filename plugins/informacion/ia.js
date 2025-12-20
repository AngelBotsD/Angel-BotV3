// plugins/angel.js
import fetch from 'node-fetch'

const API_KEY = 'may-0595dca2'
const API_URL = 'https://mayapi.ooguy.com/ai-pukamind'

const handler = async (m, { text, conn }) => {
  if (!text) {
    return m.reply('✏️ Escribe algo para preguntarle a Angel IA.\n\nEjemplo:\n.angel Hola oye jeje')
  }

  try {
    const url = `${API_URL}?q=${encodeURIComponent(text)}&apikey=${API_KEY}`
    const res = await fetch(url)
    const json = await res.json()

    if (!json.status) {
      return m.reply('❌ Error en la API.')
    }

    const respuesta = json.result || 'No hubo respuesta 😿'
    await m.reply(respuesta)

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Ocurrió un error al conectar con la IA.')
  }
}

handler.command = ['angel']
handler.help = ['angel <texto>']
handler.tags = ['ia']

export default handler
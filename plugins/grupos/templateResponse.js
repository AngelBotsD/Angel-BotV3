export async function all(m) {
  if (!m.message) return

  const msg = m.message

  // BOTONES NATIVOS
  if (msg.interactiveResponseMessage) {
    const params = msg.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson
    if (!params) return

    const data = JSON.parse(params)

    if (data.id) {
      m.text = data.id          // << AQUÍ SE CONVIERTE EN COMANDO
      m.isButton = true
    }
  }
}
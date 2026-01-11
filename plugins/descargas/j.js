export async function all(m) {
  const ir = m.message?.interactiveResponseMessage
  if (!ir) return

  const native = ir.nativeFlowResponseMessage
  if (!native?.paramsJson) return

  let params
  try {
    params = JSON.parse(native.paramsJson)
  } catch {
    return
  }

  // 👇 ESTE ES EL ID QUE DEFINES EN sendButtons
  const id = params.id || params.buttonId || params.cmd
  if (!id) return

  m.isButton = true

  // 🔑 Convertimos el botón en comando REAL
  m.text = id.startsWith('.') ? id : '.' + id
}
export async function all(m) {
  const ir = m.message?.interactiveResponseMessage
  if (!ir) return

  const native = ir.nativeFlowResponseMessage
  if (!native?.paramsJson) return

  let params
  try {
    params = JSON.parse(native.paramsJson)
  } catch (e) {
    console.error('❌ Error parseando paramsJson:', e)
    return
  }

  // 🔥 DEBUG (MIRA ESTO EN CONSOLA)
  console.log('📦 native_flow params:', params)

  // 🧠 Agarramos EL PRIMER VALOR STRING que exista
  let value = Object.values(params).find(v => typeof v === 'string')
  if (!value) return

  m.isButton = true

  // 🔑 Lo convertimos en comando REAL
  m.text = value.startsWith('.') ? value : '.' + value
}
// plugins/_allButtons.js
export async function all(m) {
  if (!m.message) return

  // 🟢 Botones clásicos
  if (m.message.buttonsResponseMessage) {
    const id = m.message.buttonsResponseMessage.selectedButtonId
    if (id) {
      m.isButton = true
      m.text = id
    }
    return
  }

  // 🟡 Template buttons (por compatibilidad)
  if (m.message.templateButtonReplyMessage) {
    const id = m.message.templateButtonReplyMessage.selectedId
    if (id) {
      m.isButton = true
      m.text = id
    }
    return
  }
}
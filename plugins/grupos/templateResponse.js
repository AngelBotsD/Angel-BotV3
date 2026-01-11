import { proto } from '@whiskeysockets/baileys'

export async function all(m, chatUpdate) {
  try {
    // 🔒 básicos
    if (!m) return
    if (m.isBaileys) return
    if (!m.message) return

    const msg = m.message

    /*
    ─────────────────────────────
    🟢 BOTONES (baileys_helper)
    ─────────────────────────────
    */

    // Caso 1: buttonsResponseMessage (el más común)
    if (msg.buttonsResponseMessage) {
      const btn =
        msg.buttonsResponseMessage.selectedButtonId ||
        msg.buttonsResponseMessage.selectedDisplayText ||
        msg.buttonsResponseMessage.buttonId ||
        ''

      m.buttonId = btn
      m.isButton = true
    }

    // Caso 2: templateButtonReplyMessage (fallback)
    else if (msg.templateButtonReplyMessage) {
      const btn =
        msg.templateButtonReplyMessage.selectedId ||
        msg.templateButtonReplyMessage.selectedDisplayText ||
        ''

      m.buttonId = btn
      m.isButton = true
    }

    // Caso 3: interactiveResponseMessage (por si acaso)
    else if (msg.interactiveResponseMessage) {
      const params =
        msg.interactiveResponseMessage.nativeFlowResponseMessage
          ?.paramsJson

      if (params) {
        try {
          const parsed = JSON.parse(params)
          m.buttonId = parsed.id || parsed.button_id || ''
          m.isButton = true
        } catch {}
      }
    }

    /*
    ─────────────────────────────
    🧠 NORMALIZACIÓN
    ─────────────────────────────
    */

    if (m.isButton) {
      // normaliza texto como si fuera comando
      m.text = m.buttonId
      m.body = m.buttonId
    }

    /*
    ─────────────────────────────
    🧪 DEBUG (opcional)
    ─────────────────────────────
    */
    /*
    if (m.isButton) {
      console.log('[BUTTON]', m.buttonId)
    }
    */

  } catch (e) {
    console.error('Error en all():', e)
  }
}
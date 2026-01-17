import {
  getContentType,
  downloadContentFromMessage
} from "@whiskeysockets/baileys"

// 🔹 helpers internos (NO permisos)
function unwrapMessage(m) {
  let n = m
  while (
    n?.viewOnceMessage?.message ||
    n?.viewOnceMessageV2?.message ||
    n?.viewOnceMessageV2Extension?.message ||
    n?.ephemeralMessage?.message
  ) {
    n =
      n.viewOnceMessage?.message ||
      n.viewOnceMessageV2?.message ||
      n.viewOnceMessageV2Extension?.message ||
      n.ephemeralMessage?.message
  }
  return n
}

function getQuoted(msg) {
  const root = unwrapMessage(msg.message) || {}
  const ctx =
    root?.extendedTextMessage?.contextInfo ||
    root?.imageMessage?.contextInfo ||
    root?.videoMessage?.contextInfo ||
    root?.audioMessage?.contextInfo ||
    root?.stickerMessage?.contextInfo ||
    root?.documentMessage?.contextInfo ||
    null

  return ctx?.quotedMessage
    ? unwrapMessage(ctx.quotedMessage)
    : null
}

const handler = async (m, { conn, args, participants = [] }) => {

  let messageToSend = null
  const quoted = getQuoted(m)

  // 1️⃣ Si hay mensaje citado → reenviar su contenido
  if (quoted) {
    const type = getContentType(quoted)

    if (type === "conversation") {
      messageToSend = { text: quoted.conversation }
    } else if (type === "extendedTextMessage") {
      messageToSend = { text: quoted.extendedTextMessage.text }
    } else {
      const stream = await downloadContentFromMessage(
        quoted[type],
        type.replace("Message", "")
      )

      let buffer = Buffer.alloc(0)
      for await (const c of stream) buffer = Buffer.concat([buffer, c])

      messageToSend = { [type.replace("Message", "")]: buffer }
    }
  }

  // 2️⃣ Si NO hay quoted → usar texto del comando
  if (!messageToSend && args.length) {
    messageToSend = { text: args.join(" ") }
  }

  // 3️⃣ Si no hay nada → diálogo
  if (!messageToSend) {
    return conn.sendMessage(
      m.chat,
      {
        text:
          "❌ *Uso incorrecto*\n\n" +
          "• `.n texto`\n" +
          "• Responde a un mensaje con `.n`"
      },
      { quoted: m }
    )
  }

  // 4️⃣ Notificación
  await conn.sendMessage(m.chat, {
    ...messageToSend,
    mentions: participants.map(p => p.id)
  })
}

handler.command = ["n", "tag", "notify"]
handler.group = true
handler.admin = true

export default handler
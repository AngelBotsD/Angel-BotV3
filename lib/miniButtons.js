import {
  generateWAMessageFromContent,
  proto
} from '@whiskeysockets/baileys'

export async function sendButtons(conn, jid, text, footer, buttons = [], quoted) {
  const interactiveMessage = {
    interactiveMessage: proto.Message.InteractiveMessage.create({
      body: proto.Message.InteractiveMessage.Body.create({ text }),
      footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: buttons.map(btn => ({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: btn.text,
            id: btn.id
          })
        }))
      })
    })
  }

  const msg = generateWAMessageFromContent(jid, interactiveMessage, { quoted })
  await conn.relayMessage(jid, msg.message, { messageId: msg.key.id })
}
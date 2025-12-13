import {
  getContentType,
  generateForwardMessageContent,
  generateWAMessageFromContent
} from '@whiskeysockets/baileys'

global.delete = global.delete || []

export async function before(m, { conn, isAdmin }) {
  if (isAdmin) return true
  if (!m.isGroup) return false
  if (m.fromMe || m.isBaileys) return true

  const chat = global.db.data.chats[m.chat]
  if (!chat?.delete) return true

  if (global.delete.length > 500) global.delete.splice(0, 200)

  if (m.key && m.message && m.type !== 'protocolMessage') {
    global.delete.push({
      key: m.key,
      message: m.message
    })
    return true
  }

  const protocol = m?.message?.protocolMessage
  if (!protocol?.key?.id) return true

  const msg = global.delete.find(v => v.key.id === protocol.key.id)
  if (!msg) return true

  const quoted = {
    key: msg.key,
    message: {
      extendedTextMessage: {
        text: '《✧》Este usuario eliminó un mensaje.'
      }
    }
  }

  await sendMessageForward(msg, {
    client: conn,
    from: m.chat,
    quoted,
    viewOnce: false
  })

  global.delete = global.delete.filter(v => v.key.id !== msg.key.id)
  return true
}

async function sendMessageForward(msg, opts = {}) {
  const originalType = getContentType(msg.message)
  const forwardContent = await generateForwardMessageContent(msg, {
    forwardingScore: 999,
    forceForward: true
  })
  const forwardType = getContentType(forwardContent)

  if (opts.text) {
    if (forwardType === 'conversation') {
      forwardContent[forwardType] = opts.text
    } else if (forwardType === 'extendedTextMessage') {
      forwardContent[forwardType].text = opts.text
    } else {
      forwardContent[forwardType].caption = opts.text
    }
  }

  if (typeof opts.viewOnce === 'boolean') {
    forwardContent[forwardType].viewOnce = opts.viewOnce
  }

  forwardContent[forwardType].contextInfo = {
    ...(msg.message[originalType]?.contextInfo || {}),
    isForwarded: true
  }

  const newMsg = await generateWAMessageFromContent(
    opts.from,
    forwardContent,
    {
      userJid: opts.client.user.id,
      quoted: opts.quoted || msg
    }
  )

  await opts.client.relayMessage(
    opts.from,
    newMsg.message,
    { messageId: newMsg.key.id }
  )

  return newMsg
}
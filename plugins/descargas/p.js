const {
  proto,
  generateWAMessage,
  areJidsSameUser
} = (await import('@whiskeysockets/baileys')).default

export async function all(m, chatUpdate = {}) {
  if (!m || m.isBaileys || !m.message) return

handler.before = async (m, { conn }) => {
  if (!m.message?.buttonsResponseMessage) return

  const msgButtons =
    m.message.buttonsResponseMessage ||
    m.message.templateButtonReplyMessage ||
    m.message.listResponseMessage ||
    m.message.interactiveResponseMessage

  if (!msgButtons) return

  let text = null

  if (m.message.buttonsResponseMessage) {
    text = m.message.buttonsResponseMessage.selectedButtonId
      || m.message.buttonsResponseMessage.selectedDisplayText
  } else if (m.message.templateButtonReplyMessage) {
    text = m.message.templateButtonReplyMessage.selectedId
      || m.message.templateButtonReplyMessage.selectedDisplayText
  } else if (m.message.listResponseMessage) {
    text = m.message.listResponseMessage.singleSelectReply?.selectedRowId
  } else if (m.message.interactiveResponseMessage) {
    const json =
      m.message.interactiveResponseMessage
        .nativeFlowResponseMessage
        ?.paramsJson
    if (json) text = JSON.parse(json).id
  }

  if (!text) return

  const message = await generateWAMessage(
    m.chat,
    { text },
    {
      userJid: this.user.id,
      quoted: m.quoted?.fakeObj
    }
  )

  message.key.fromMe = areJidsSameUser(m.sender, this.user.id)
  message.key.id = m.key.id
  message.pushName = m.name

  if (m.isGroup) {
    message.key.participant = m.sender
    message.participant = m.sender
  }

  const upsert = {
    ...chatUpdate,
    messages: [
      proto.WebMessageInfo.fromObject(message)
    ].map(v => (v.conn = this, v)),
    type: 'append'
  }

  this.ev.emit('messages.upsert', upsert)
}
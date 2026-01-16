const {
  proto,
  generateWAMessage,
  areJidsSameUser
} = (await import('@whiskeysockets/baileys')).default

export async function all(m, chatUpdate) {
  if (!m || m.isBaileys || !m.message) return

  const msgButtons =
    m.message.buttonsResponseMessage ||
    m.message.templateButtonReplyMessage ||
    m.message.listResponseMessage ||
    m.message.interactiveResponseMessage

  if (!msgButtons) return

  let id = null
  let text = null

  if (m.message.buttonsResponseMessage) {
    id = m.message.buttonsResponseMessage.selectedButtonId
    text = m.message.buttonsResponseMessage.selectedDisplayText
  } else if (m.message.templateButtonReplyMessage) {
    id = m.message.templateButtonReplyMessage.selectedId
    text = m.message.templateButtonReplyMessage.selectedDisplayText
  } else if (m.message.listResponseMessage) {
    id = m.message.listResponseMessage.singleSelectReply?.selectedRowId
    text = m.message.listResponseMessage.title
  } else if (m.message.interactiveResponseMessage) {
    const json = m.message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson
    if (json) id = JSON.parse(json).id
  }

  if (!id) return

  let isIdMessage = false
  let usedPrefix

  for (const name in global.plugins) {
    const plugin = global.plugins[name]
    if (!plugin || plugin.disabled) continue

    if (!opts?.restrict && plugin.tags?.includes('admin')) continue
    if (typeof plugin !== 'function' || !plugin.command) continue

    const escape = s => s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

    const prefixes =
      plugin.customPrefix ??
      this.prefix ??
      global.prefix

    const match = (
      prefixes instanceof RegExp
        ? [[prefixes.exec(id), prefixes]]
        : Array.isArray(prefixes)
          ? prefixes.map(p => {
              const r = p instanceof RegExp ? p : new RegExp(escape(p))
              return [r.exec(id), r]
            })
          : typeof prefixes === 'string'
            ? [[new RegExp(escape(prefixes)).exec(id), new RegExp(escape(prefixes))]]
            : []
    ).find(v => v[0])

    if (!match) continue

    usedPrefix = match[0][0]
    const noPrefix = id.slice(usedPrefix.length).trim()
    const command = noPrefix.split(/\s+/)[0]?.toLowerCase()

    const valid =
      plugin.command instanceof RegExp
        ? plugin.command.test(command)
        : Array.isArray(plugin.command)
          ? plugin.command.some(c => c instanceof RegExp ? c.test(command) : c === command)
          : plugin.command === command

    if (!valid) continue

    isIdMessage = true
    break
  }

  const message = await generateWAMessage(
    m.chat,
    {
      text: isIdMessage ? id : text,
      mentions: m.mentionedJid
    },
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
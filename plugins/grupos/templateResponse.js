import {
  proto,
  generateWAMessage,
  areJidsSameUser
} from "@whiskeysockets/baileys"

export async function all(m, chatUpdate) {
  if (m.isBaileys) return
  if (!m.message) return

  let id = null
  let text = null

  // ==========================
  // BOTONES CLÁSICOS
  // ==========================
  if (m.message.buttonsResponseMessage) {
    id = m.message.buttonsResponseMessage.selectedButtonId
    text = m.message.buttonsResponseMessage.selectedDisplayText
  }

  // ==========================
  // TEMPLATE BUTTON
  // ==========================
  else if (m.message.templateButtonReplyMessage) {
    id = m.message.templateButtonReplyMessage.selectedId
    text = m.message.templateButtonReplyMessage.selectedDisplayText
  }

  // ==========================
  // LIST MESSAGE
  // ==========================
  else if (m.message.listResponseMessage) {
    id = m.message.listResponseMessage.singleSelectReply?.selectedRowId
    text = m.message.listResponseMessage.title
  }

  // ==========================
  // INTERACTIVE (EL BUENO)
  // ==========================
  else if (m.message.interactiveResponseMessage) {
    const ir = m.message.interactiveResponseMessage

    // 🔥 ESTE ERA EL QUE FALTABA
    if (ir.buttonReply) {
      id = ir.buttonReply.id
      text = ir.buttonReply.title
    }

    // nativeFlow (por si acaso)
    else if (ir.nativeFlowResponseMessage?.paramsJson) {
      try {
        const json = JSON.parse(ir.nativeFlowResponseMessage.paramsJson)
        id = json.id
        text = json.title
      } catch {}
    }
  }

  if (!id) return

  // ==========================
  // DETECTAR COMANDO
  // ==========================
  let isIdMessage = false
  let usedPrefix = ""
  let finalText = id

  for (const name in global.plugins) {
    const plugin = global.plugins[name]
    if (!plugin || plugin.disabled || !plugin.command) continue

    const prefixes = Array.isArray(global.prefixes)
      ? global.prefixes
      : [global.prefix || "."]

    const found = prefixes.find(p =>
      typeof p === "string"
        ? id.startsWith(p)
        : p instanceof RegExp
          ? p.test(id)
          : false
    )

    if (!found) continue

    usedPrefix =
      found instanceof RegExp
        ? id.match(found)?.[0] || ""
        : found

    const noPrefix = id.slice(usedPrefix.length)
    let [command] = noPrefix.trim().split(/\s+/)
    command = (command || "").toLowerCase()

    const isAccept =
      plugin.command instanceof RegExp
        ? plugin.command.test(command)
        : Array.isArray(plugin.command)
          ? plugin.command.includes(command)
          : plugin.command === command

    if (!isAccept) continue

    isIdMessage = true
    finalText = `${usedPrefix}${noPrefix}`
    break
  }

  // ==========================
  // REINYECTAR COMO TEXTO
  // ==========================
  const messages = await generateWAMessage(
    m.chat,
    { text: finalText },
    {
      userJid: this.user.id,
      quoted: m.quoted && m.quoted.fakeObj
    }
  )

  messages.fromButton = true
  messages.key.fromMe = areJidsSameUser(m.sender, this.user.id)
  messages.key.id = m.key.id
  messages.pushName = m.name

  if (m.isGroup) {
    messages.key.participant = m.sender
  }

  const msg = {
    ...chatUpdate,
    messages: [
      proto.WebMessageInfo.fromObject(messages)
    ].map(v => (v.conn = this, v)),
    type: "append"
  }

  this.ev.emit("messages.upsert", msg)
}
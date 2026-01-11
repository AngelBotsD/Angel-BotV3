import {
  proto,
  generateWAMessage,
  areJidsSameUser
} from "@whiskeysockets/baileys"

export async function all(m, chatUpdate) {
  if (m.isBaileys) return
  if (!m.message) return

  const msgButtons =
    m.message.buttonsResponseMessage ||
    m.message.templateButtonReplyMessage ||
    m.message.listResponseMessage ||
    m.message.interactiveResponseMessage

  if (!msgButtons) return

  // ===============================
  // EXTRAER ID Y TEXTO DEL BOTÓN
  // ===============================

  let id = null
  let text = null

  if (m.message.buttonsResponseMessage) {
    id = m.message.buttonsResponseMessage.selectedButtonId
    text = m.message.buttonsResponseMessage.selectedDisplayText
  }

  else if (m.message.templateButtonReplyMessage) {
    id = m.message.templateButtonReplyMessage.selectedId
    text = m.message.templateButtonReplyMessage.selectedDisplayText
  }

  else if (m.message.listResponseMessage) {
    id = m.message.listResponseMessage.singleSelectReply?.selectedRowId
    text = m.message.listResponseMessage.title
  }

  else if (m.message.interactiveResponseMessage) {
    const params =
      m.message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson

    if (params) {
      try {
        const json = JSON.parse(params)
        id = json.id || null
        text = json.title || null
      } catch {
        return
      }
    }
  }

  if (!id) return

  // ===============================
  // DETECTAR COMANDO
  // ===============================

  let isIdMessage = false
  let usedPrefix = ""
  let finalText = text || id

  for (const name in global.plugins) {
    const plugin = global.plugins[name]
    if (!plugin || plugin.disabled) continue
    if (typeof plugin !== "function") continue
    if (!plugin.command) continue

    // customPrefix
    if (plugin.customPrefix) {
      if (plugin.customPrefix instanceof RegExp) {
        const match = id.match(plugin.customPrefix)
        if (!match) continue
        usedPrefix = match[0]
      } else if (typeof plugin.customPrefix === "string") {
        if (!id.startsWith(plugin.customPrefix)) continue
        usedPrefix = plugin.customPrefix
      }
    } else {
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
    }

    const noPrefix = id.slice(usedPrefix.length)
    let [command] = noPrefix.trim().split(/\s+/)
    command = (command || "").toLowerCase()

    const isAccept =
      plugin.command instanceof RegExp
        ? plugin.command.test(command)
        : Array.isArray(plugin.command)
          ? plugin.command.some(cmd =>
              cmd instanceof RegExp ? cmd.test(command) : cmd === command
            )
          : plugin.command === command

    if (!isAccept) continue

    isIdMessage = true
    finalText = `${usedPrefix}${noPrefix}`
    break
  }

  // ===============================
  // REINYECTAR MENSAJE COMO TEXTO
  // ===============================

  const messages = await generateWAMessage(
    m.chat,
    {
      text: isIdMessage ? finalText : text,
      mentions: m.mentionedJid
    },
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
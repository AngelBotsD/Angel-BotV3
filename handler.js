import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import fs from "fs"
import chalk from "chalk"
import fetch from "node-fetch"

const DIGITS = (s = "") => String(s).replace(/\D/g, "")

function lidParser(participants = []) {
  try {
    return participants.map(v => ({
      id: (typeof v?.id === "string" && v.id.endsWith("@lid") && v.jid)
        ? v.jid
        : v.id,
      admin: v?.admin ?? null,
      raw: v
    }))
  } catch {
    return participants || []
  }
}

const OWNER_NUMBERS = (global.owner || []).map(v =>
  Array.isArray(v) ? DIGITS(v[0]) : DIGITS(v)
)

let ICON_BUFFER = null

async function getIconBuffer() {
  if (ICON_BUFFER) return ICON_BUFFER
  try {
    const res = await fetch("https://files.catbox.moe/u1lwcu.jpg")
    ICON_BUFFER = Buffer.from(await res.arrayBuffer())
    return ICON_BUFFER
  } catch {
    return null
  }
}
getIconBuffer()

function dialogContext() {
  if (!ICON_BUFFER) return {}
  return {
    contextInfo: {
      externalAdReply: {
        title: global.namebot || "𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍",
        body: global.author,
        thumbnail: ICON_BUFFER,
        mediaType: 1,
        renderLargerThumbnail: false
      }
    }
  }
}

global.dfail = async (type, m, conn) => {
  const msg = {
    rowner: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋",
    owner: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋",
    mods: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖽𝖾𝗌𝖺𝗋𝗋𝗈𝗅𝗅𝖺𝖽𝗈𝗋𝖾𝗌",
    premium: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖫𝗈 𝖯𝗎𝖾𝖽𝖾𝗇 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝗋 𝖴𝗌𝖺𝗋𝗂𝗈𝗌 𝖯𝗋𝖾𝗆𝗂𝗎𝗆",
    group: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖥𝗎𝗇𝖼𝗂𝗈𝗇𝖺 𝖤𝗇 𝖦𝗋𝗎𝗉𝗈𝗌",
    private: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖲𝖾 𝖯𝗎𝖾𝖽𝖾 𝖮𝖼𝗎𝗉𝖺𝗋 𝖤𝗇 𝖤𝗅 𝖯𝗋𝗂𝗏𝖺𝖽𝗈",
    admin: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖠𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺𝖽𝗈𝗋𝖾𝗌",
    botAdmin: "𝖭𝖾𝖼𝗌𝗂𝗍𝗈 𝗌𝖾𝗋 𝖠𝖽𝗆𝗂𝗇 𝖯𝖺𝗋𝖺 𝖴𝗌𝖺𝗋 𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈",
    restrict: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖧𝖺 𝖲𝗂𝖽𝗈 𝖣𝖾𝗌𝖺𝖻𝗂𝗅𝗂𝗍𝖺𝖽𝗈"
  }[type]

  if (!msg) return
  conn.sendMessage(m.chat, { text: msg }, { quoted: m, ...dialogContext() })
}

global.groupMetaCache ||= new Map()

export function handler(chatUpdate) {
  if (!chatUpdate?.messages) return
  for (const raw of chatUpdate.messages) {
    handleMessage.call(this, raw)
  }
}

async function handleMessage(m) {
  if (!m) return

  m = smsg(this, m)
  if (!m || m.isBaileys) return

  const textMsg =
    m.text ||
    m.msg?.caption ||
    m.msg?.selectedButtonId ||
    m.msg?.singleSelectReply?.selectedRowId ||
    m.msg?.templateButtonReplyMessage?.selectedId

  if (!textMsg) return

  const prefixes = global._prefixCache ||= Object.freeze(
    Array.isArray(global.prefixes)
      ? global.prefixes
      : [global.prefix || "."]
  )

  let usedPrefix = null
  let command = ""
  let args = []

  if (prefixes.includes(textMsg[0])) {
    usedPrefix = textMsg[0]
    const body = textMsg.slice(1).trim()
    if (!body) return
    args = body.split(/\s+/)
    command = (args.shift() || "").toLowerCase()
  } else {
    args = textMsg.trim().split(/\s+/)
    command = args[0]?.toLowerCase() || ""
  }

  const senderNumber = DIGITS(m.sender)
  const isROwner = OWNER_NUMBERS.includes(senderNumber)
  const isOwner = isROwner || m.fromMe

  let groupMetadata, participants, isAdmin = false, isBotAdmin = !m.isGroup

  const loadGroupData = async () => {
    if (!m.isGroup) return
    const meta = await this.groupMetadata(m.chat)
    groupMetadata = meta
    participants = meta.participants || []
    const admins = participants.filter(p => p.admin)
    isAdmin = admins.some(p => DIGITS(p.id) === senderNumber)
    isBotAdmin = admins.some(p => DIGITS(p.id) === DIGITS(this.user.jid))
  }

  for (const plugin of Object.values(global.plugins)) {
    if (!plugin || plugin.disabled) continue

    let isAccept = false
    if (plugin.customPrefix instanceof RegExp) {
      isAccept = plugin.customPrefix.test(textMsg)
    } else if (plugin.command) {
      isAccept =
        plugin.command instanceof RegExp
          ? plugin.command.test(command)
          : Array.isArray(plugin.command)
            ? plugin.command.includes(command)
            : plugin.command === command
    }

    if (!isAccept) continue

    if (plugin.group && !m.isGroup) return global.dfail("group", m, this)
    if (m.isGroup && (plugin.admin || plugin.botAdmin)) await loadGroupData()
    if (plugin.rowner && !isROwner) return global.dfail("rowner", m, this)
    if (plugin.owner && !isOwner) return global.dfail("owner", m, this)
    if (plugin.botAdmin && !isBotAdmin) return global.dfail("botAdmin", m, this)
    if (plugin.admin && !isAdmin) return global.dfail("admin", m, this)

    const exec =
      typeof plugin === "function"
        ? plugin
        : typeof plugin.default === "function"
          ? plugin.default
          : null

    if (exec) {
      await exec.call(this, m, {
        conn: this,
        args,
        usedPrefix,
        command,
        participants,
        groupMetadata,
        isROwner,
        isOwner,
        isAdmin,
        isBotAdmin,
        chat: m.chat
      })
    }
  }
}

if (process.env.NODE_ENV === "development") {
  const file = fileURLToPath(import.meta.url)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.magenta("Se actualizó 'handler.js'"))
  })
}
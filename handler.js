import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import fs from "fs"
import chalk from "chalk"
import fetch from "node-fetch"

const DIGITS = (s = "") => String(s).replace(/\D/g, "")

function lidParser(participants = []) {
  try {
    return participants.map(v => ({
      id: (typeof v?.id === "string" && v.id.endsWith("@lid") && v.jid) ? v.jid : v.id,
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
  await conn.sendMessage(m.chat, { text: msg }, { quoted: m, ...dialogContext() })
}

global.groupMetaCache ||= new Map()

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of global.groupMetaCache) {
    if (now - v.ts > 30000) global.groupMetaCache.delete(k)
  }
}, 60000)

global.commandMap ||= new Map()
global.regexPlugins ||= []

if (!global._cmdBuilt) {
  for (const p of Object.values(global.plugins || {})) {
    if (!p || p.disabled) continue
    if (p.command instanceof RegExp) {
      global.regexPlugins.push(p)
    } else if (Array.isArray(p.command)) {
      for (const c of p.command) global.commandMap.set(c, p)
    } else if (typeof p.command === "string") {
      global.commandMap.set(p.command, p)
    }
  }
  global._cmdBuilt = true
}

export function handler(chatUpdate) {
  if (!chatUpdate?.messages) return
  for (const raw of chatUpdate.messages) handleMessage.call(this, raw)
}

async function handleMessage(m) {
  m = smsg(this, m)
  if (!m || m.isBaileys) return

  const text = m.text
  if (!text || text.length < 2) return

  const prefixes = global._prefixCache ||= (Array.isArray(global.prefixes) ? global.prefixes : [global.prefix || "."])
  const first = text[0]
  if (!prefixes.includes(first)) return

  const body = text.slice(1).trim()
  if (!body) return

  const args = body.split(" ")
  const command = (args.shift() || "").toLowerCase()

  let plugin = global.commandMap.get(command)
  if (!plugin) {
    for (const p of global.regexPlugins) {
      if (p.command.test(command)) {
        plugin = p
        break
      }
    }
  }
  if (!plugin) return

  const senderNumber = DIGITS(m.sender)
  const isROwner = OWNER_NUMBERS.includes(senderNumber)
  const isOwner = isROwner || m.fromMe

  let isAdmin = false
  let isBotAdmin = !m.isGroup
  let groupMetadata
  let participants

  if (m.isGroup && (plugin.group || plugin.admin || plugin.botAdmin)) {
    let cached = global.groupMetaCache.get(m.chat)
    if (!cached) {
      cached = { ts: Date.now(), meta: await this.groupMetadata(m.chat) }
      global.groupMetaCache.set(m.chat, cached)
    }
    groupMetadata = cached.meta
    participants = groupMetadata.participants || []
    const raw = participants
    const norm = lidParser(raw)
    const senderNum = DIGITS(m.sender)
    const botNum = DIGITS(this.user.jid)
    for (let i = 0; i < raw.length; i++) {
      const r = raw[i]
      const n = norm[i]
      const adm = r?.admin || n?.admin
      if (!adm) continue
      const ids = [r?.id, r?.jid, n?.id]
      for (const x of ids) {
        const d = DIGITS(x || "")
        if (d === senderNum) isAdmin = true
        if (d === botNum) isBotAdmin = true
      }
      if (isAdmin && isBotAdmin) break
    }
  }

  if (plugin.rowner && !isROwner) return global.dfail("rowner", m, this)
  if (plugin.owner && !isOwner) return global.dfail("owner", m, this)
  if (plugin.group && !m.isGroup) return global.dfail("group", m, this)
  if (plugin.botAdmin && !isBotAdmin) return global.dfail("botAdmin", m, this)
  if (plugin.admin && !isAdmin) return global.dfail("admin", m, this)

  const exec = typeof plugin === "function" ? plugin : plugin.default
  if (!exec) return

  exec.call(this, m, {
    conn: this,
    args,
    command,
    isROwner,
    isOwner,
    isAdmin,
    isBotAdmin,
    groupMetadata,
    participants,
    chat: m.chat
  })
}

if (process.env.NODE_ENV === "development") {
  const file = fileURLToPath(import.meta.url)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.magenta("Se actualizó 'handler.js'"))
  })
}
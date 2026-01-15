import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"
import chalk from "chalk"
import fetch from "node-fetch"

const DIGITS = (s = "") => String(s).replace(/\D/g, "")

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

function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("PLUGIN_TIMEOUT")), ms)
  )
}

if (typeof global.beforeAll !== "function")
  global.beforeAll = async function (m) {
    try {
      const nombreBot = global.namebot || "𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍"
      const canales = [global.idcanal, global.idcanal2].filter(Boolean)
      const newsletterJidRandom = canales.length
        ? canales[Math.floor(Math.random() * canales.length)]
        : null

      global.rcanal = {
        contextInfo: {
          isForwarded: true,
          forwardingScore: 1,
          ...(newsletterJidRandom && {
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJidRandom,
              serverMessageId: 100,
              newsletterName: global.namecanal
            }
          }),
          externalAdReply: {
            title: nombreBot,
            body: global.author,
            thumbnail: ICON_BUFFER,
            sourceUrl: null,
            mediaType: 1,
            renderLargerThumbnail: false
          }
        }
      }
    } catch {}
  }

global.dfail = async (type, m, conn) => {
  const msg = {
    rowner: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋",
    owner: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋",
    mods: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖽𝖾𝗌𝖺𝗋𝗋𝗈𝗅𝗅𝖺𝖽𝗈𝗋𝖾𝗌",
    premium: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖫𝗈 𝖯𝗎𝖾𝖽𝖾𝗇 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝗋 𝖴𝗌𝗎𝖺𝗋𝗂𝗈𝗌 𝖯𝗋𝖾𝗆𝗂𝗎𝗆",
    group: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖥𝗎𝗇𝖼𝗂𝗈𝗇𝖺 𝖤𝗇 𝖦𝗋𝗎𝗉𝗈𝗌",
    private: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖲𝖾 𝖯𝗎𝖾𝖽𝖾 𝖮𝖼𝗎𝗉𝖺𝗋 𝖤𝗇 𝖤𝗅 𝖯𝗋𝗂𝗏𝖺𝖽𝗈",
    admin: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖠𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺𝖽𝗈𝗋𝖾𝗌",
    botAdmin: "𝖭𝖾𝖼𝗌𝗂𝗍𝗈 𝗌𝖾𝗋 𝖠𝖽𝗆𝗂𝗇 𝖯𝖺𝗋𝖺 𝖴𝗌𝖺𝗋 𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈",
    restrict: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖧𝖺 𝖲𝗂𝖽𝗈 𝖣𝖾𝗌𝖺𝖻𝗂𝗅𝗂𝗍𝖺𝖽𝗈"
  }[type]

  if (!msg) return

  await conn.sendMessage(
    m.chat,
    { text: msg },
    { quoted: m, ...(global.rcanal || {}) }
  )
}

global.handledMessages ||= new Map()
global.groupMetaCache ||= new Map()

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of global.handledMessages)
    if (now - v > 120000) global.handledMessages.delete(k)
  for (const [k, v] of global.groupMetaCache)
    if (now - v.ts > 15000) global.groupMetaCache.delete(k)
}, 30000)

export async function handler(chatUpdate) {
  if (!chatUpdate) return

  let m = chatUpdate.messages?.slice(-1)[0]
  if (!m) return

  if (m.key?.id) {
    const prev = global.handledMessages.get(m.key.id)
    if (prev && Date.now() - prev < 8000) return
    global.handledMessages.set(m.key.id, Date.now())
  }

  m = smsg(this, m)
if (!m) return

  const prefixes = Array.isArray(global.prefixes)
    ? global.prefixes
    : [global.prefix || "."]

  const usedPrefix = prefixes.find(p =>
    typeof p === "string"
      ? m.text.startsWith(p)
      : p instanceof RegExp && p.test(m.text)
  )
  const hasCustomPrefixPlugin = Object.values(global.plugins).some(
  p => p?.customPrefix instanceof RegExp && p.customPrefix.test(m.text)
)

const pluginMatch = Object.values(global.plugins).some(
  p =>
    p?.customPrefix instanceof RegExp &&
    (
      p.customPrefix.test(m.text) ||
      p.customPrefix.test(m.msg?.caption || "")
    )
)

if (!usedPrefix && !pluginMatch) return

  let text = ""
let command = ""
let args = []

if (usedPrefix) {
  const cut = usedPrefix instanceof RegExp
    ? m.text.match(usedPrefix)[0].length
    : usedPrefix.length

  text = m.text.slice(cut)
  args = text.trim().split(/\s+/)
  command = (args.shift() || "").toLowerCase()
} else {
  text = m.text.trim()
  args = text.split(/\s+/)
  command = args[0]?.toLowerCase() || ""
}

  global.beforeAll?.call(this, m).catch(() => {})

  const senderNumber = DIGITS(m.sender)
  const isROwner = OWNER_NUMBERS.includes(senderNumber)
  const isOwner = isROwner || m.fromMe

  let groupMetadata = {}
  let participants = []
  let isAdmin = false
  let isBotAdmin = !m.isGroup

  if (m.isGroup) {
    let cached = global.groupMetaCache.get(m.chat)
    if (!cached) {
      const meta = await this.groupMetadata(m.chat)
      cached = { ts: Date.now(), meta }
      global.groupMetaCache.set(m.chat, cached)
    }

    groupMetadata = cached.meta
    participants = groupMetadata.participants || []

    const userP = participants.find(p => p.id === m.sender)
    const botP = participants.find(p => p.id === this.user.jid)

    isAdmin =
      userP?.admin === "admin" ||
      userP?.admin === "superadmin"

    isBotAdmin =
      botP?.admin === "admin" ||
      botP?.admin === "superadmin"
  }

  for (const name in global.plugins) {
  const plugin = global.plugins[name]
  if (!plugin || plugin.disabled) continue

  let isAccept = false

if (plugin.customPrefix instanceof RegExp) {
  isAccept = plugin.customPrefix.test(m.text)
} else if (plugin.command) {
  isAccept =
    plugin.command instanceof RegExp
      ? plugin.command.test(command)
      : Array.isArray(plugin.command)
        ? plugin.command.includes(command)
        : plugin.command === command
}

if (!isAccept) continue

  if (plugin.rowner && !isROwner) return global.dfail("rowner", m, this)
  if (plugin.owner && !isOwner) return global.dfail("owner", m, this)
  if (plugin.group && !m.isGroup) return global.dfail("group", m, this)
  if (plugin.botAdmin && !isBotAdmin) return global.dfail("botAdmin", m, this)
  if (plugin.admin && !isAdmin) return global.dfail("admin", m, this)

  const exec =
    typeof plugin === "function"
      ? plugin
      : typeof plugin.default === "function"
        ? plugin.default
        : null

  if (!exec) continue

  Promise.race([
    exec.call(this, m, {
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
    }),
    timeout(3000)
  ]).catch(() => {})

  break
 }
}

if (process.env.NODE_ENV === "development") {
  const file = fileURLToPath(import.meta.url)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.magenta("Se actualizó 'handler.js'"))
  })
}
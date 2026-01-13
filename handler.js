import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"
import chalk from "chalk"
import fetch from "node-fetch"

let ICON_BUFFER = null

const DIGITS = (s = "") => String(s).replace(/\D/g, "")

const OWNER_NUMBERS = (global.owner || []).map(v =>
  Array.isArray(v) ? DIGITS(v[0]) : DIGITS(v)
)

async function getIconBuffer() {
  if (ICON_BUFFER) return ICON_BUFFER
  try {
    const res = await fetch("https://files.catbox.moe/dkw6yn.jpg")
    ICON_BUFFER = Buffer.from(await res.arrayBuffer())
    return ICON_BUFFER
  } catch {
    return null
  }
}

getIconBuffer()

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

global.dfail = (type, m, conn) => {
  const msg = {
    rowner: "*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋*",
    owner: "*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝖺𝗋*",
    mods: "*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖽𝖾𝗌𝖺𝗋𝗋𝗈𝗅𝗅𝖺𝖽𝗈𝗋𝖾𝗌*",
    premium: "*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖫𝗈 𝖯𝗎𝖾𝖽𝖾𝗇 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝗋 𝖴𝗌𝗎𝖺𝗋𝗂𝗈𝗌 𝖯𝗋𝖾𝗆𝗂𝗎𝗆*",
    group: "*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖥𝗎𝗇𝖼𝗂𝗈𝗇𝖺 𝖤𝗇 𝖦𝗋𝗎𝗉𝗈𝗌*",
    private: "*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖲𝖾 𝖯𝗎𝖾𝖽𝖾 𝖮𝖼𝗎𝗉𝖺𝗋 𝖤𝗇 𝖤𝗅 𝖯𝗋𝗂𝗏𝖺𝖽𝗈*",
    admin: "*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖠𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺𝖽𝗈𝗋𝖾𝗌*",
    botAdmin: "*𝖭𝖾𝖼𝖾𝗌𝗂𝗍𝗈 𝗌𝖾𝗋 𝖠𝖽𝗆𝗂𝗇 𝖯𝖺𝗋𝖺 𝖴𝗌𝖺𝗋 𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈*",
    restrict: "*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖧𝖺 𝖲𝗂𝖽𝗈 𝖣𝖾𝗌𝖺𝖻𝗂𝗅𝗂𝗍𝖺𝖽𝗈*"
  }[type]

  if (msg)
    conn.reply(m.chat, msg, m, global.rcanal || {})
      .then(() => m.react("✖️"))
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
    if (prev && Date.now() - prev < 10000) return
    global.handledMessages.set(m.key.id, Date.now())
  }

  if (global.db.data == null)
    await global.loadDatabase()

  m = smsg(this, m)
  if (!m || !m.text) return

const isCommandLike =
  (Array.isArray(global.prefixes)
    ? global.prefixes
    : [global.prefix || "."])
    .some(p => typeof p === "string"
      ? m.text.startsWith(p)
      : p instanceof RegExp && p.test(m.text))

if (!isCommandLike && !Object.values(global.plugins).some(p => p.customPrefix))
  return

  await global.beforeAll?.call(this, m)

  const senderNumber = DIGITS(m.sender)

  const user = global.db.data.users[m.sender] ||= {
    name: m.name,
    exp: 0,
    level: 0,
    health: 100,
    premium: false,
    premiumTime: 0,
    banned: false,
    commands: 0,
    afk: -1,
    afkReason: ""
  }

  const chat = global.db.data.chats[m.chat] ||= {
    isBanned: false,
    isMute: false,
    welcome: false,
    detect: true
  }

  const settings = global.db.data.settings[this.user.jid] ||= {
    self: false,
    restrict: true
  }

  const isROwner = OWNER_NUMBERS.includes(senderNumber)
  const isOwner = isROwner || m.fromMe
  const isPrems = isROwner || user.premium === true

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

    const userJid = m.sender.split(':')[0]
const botJid = (this.user.id || this.user.jid).split(':')[0]

const getJid = p => (p.id || p.jid || "").split(":")[0]

const userP = participants.find(
  p => getJid(p) === userJid
)

const botP = participants.find(
  p => getJid(p) === botJid
)

    isAdmin =
  userP?.admin === true ||
  userP?.admin === "admin" ||
  userP?.admin === "superadmin" ||
  DIGITS(groupMetadata.owner) === DIGITS(userJid)

isBotAdmin =
  botP?.admin === true ||
  botP?.admin === "admin" ||
  botP?.admin === "superadmin"

m.isBotAdmin = isBotAdmin
m.isAdmin = isAdmin

this.isBotAdmin = isBotAdmin
this.isAdmin = isAdmin
  }

  for (const name in global.plugins) {
    const plugin = global.plugins[name]
    if (!plugin || plugin.disabled) continue

    let usedPrefix = ""
    let command = ""
    let args = []

    if (plugin.customPrefix) {
      const match = m.text.match(plugin.customPrefix)
      if (!match) continue
      usedPrefix = match[0]
      const text = m.text.slice(usedPrefix.length)
      args = text.trim().split(/\s+/)
      command = (args.shift() || "").toLowerCase()
    } else {
      const prefixes = Array.isArray(global.prefixes)
        ? global.prefixes
        : [global.prefix || "."]

      const found = prefixes.find(p =>
        typeof p === "string"
          ? m.text.startsWith(p)
          : p instanceof RegExp && p.test(m.text)
      )

      if (!found) continue

      usedPrefix = found instanceof RegExp
        ? m.text.match(found)?.[0] || ""
        : found

      const text = m.text.slice(usedPrefix.length)
      args = text.trim().split(/\s+/)
      command = (args.shift() || "").toLowerCase()
    }

    if (plugin.command) {
  if (
    plugin.customPrefix &&
    plugin.command instanceof RegExp &&
    plugin.command.source === "(?:)"
  ) {
  } else {
    const isAccept =
      plugin.command instanceof RegExp
        ? plugin.command.test(command)
        : Array.isArray(plugin.command)
          ? plugin.command.includes(command)
          : plugin.command === command

    if (!isAccept) continue
  }
}

    user.commands++

    if (plugin.rowner && !isROwner) return global.dfail("rowner", m, this)
    if (plugin.owner && !isOwner) return global.dfail("owner", m, this)
    if (plugin.premium && !isPrems) return global.dfail("premium", m, this)
    if (plugin.group && !m.isGroup) return global.dfail("group", m, this)
    if (plugin.botAdmin && !isBotAdmin) return global.dfail("botAdmin", m, this)
    if (plugin.admin && !isAdmin) return global.dfail("admin", m, this)
    if (plugin.private && m.isGroup) return global.dfail("private", m, this)

    const exec =
  typeof plugin === "function"
    ? plugin
    : typeof plugin.default === "function"
      ? plugin.default
      : null

if (!exec) continue

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
  isPrems,
  chat,
  user,
  settings
})

    break
  }
}

if (process.env.NODE_ENV === "development") {
  const file = fileURLToPath(import.meta.url)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.magenta("Se actualizo 'handler.js'"))
  })
}
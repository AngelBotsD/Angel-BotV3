import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import fs from "fs"
import chalk from "chalk"
import fetch from "node-fetch"

const DIGITS = s => String(s || "").replace(/\D/g, "")

const OWNER_NUMBERS = (global.owner || []).map(v =>
  Array.isArray(v) ? DIGITS(v[0]) : DIGITS(v)
)

let ICON_BUFFER = null
let ICON_PROMISE = null

async function getIconBuffer() {
  if (ICON_BUFFER) return ICON_BUFFER
  if (ICON_PROMISE) return ICON_PROMISE

  ICON_PROMISE = fetch("https://files.catbox.moe/u1lwcu.jpg")
    .then(r => r.arrayBuffer())
    .then(b => (ICON_BUFFER = Buffer.from(b)))
    .catch(() => null)

  return ICON_PROMISE
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
    group: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖥𝗎𝗇𝖼𝗂𝗈𝗇𝖺 𝖤𝗇 𝖦𝗋𝗎𝗉𝖺𝗌",
    private: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖲𝖾 𝖯𝗎𝖾𝖽𝖾 𝖮𝖼𝗎𝗉𝖺𝗋 𝖤𝗇 𝖤𝗅 𝖯𝗋𝗂𝗏𝖺𝖽𝗈",
    admin: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖠𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺𝖽𝗈𝗋𝖾𝗌",
    botAdmin: "𝖭𝖾𝖼𝗌𝗂𝗍𝗈 𝗌𝖾𝗋 𝖠𝖽𝗆𝗂𝗇 𝖯𝖺𝗋𝖺 𝖴𝗌𝖺𝗋 𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈",
    restrict: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖧𝖺 𝖲𝗂𝖽𝗈 𝖣𝖾𝗌𝖺𝖻𝗂𝗅𝗂𝗍𝖺𝖽𝗈"
  }[type]

  if (!msg) return

  await conn.sendMessage(
    m.chat,
    { text: msg },
    { quoted: m, ...dialogContext() }
  )
}

global.groupMetaCache ||= new Map()

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of global.groupMetaCache)
    if (now - v.ts > 15000) global.groupMetaCache.delete(k)
}, 30000)

export async function handler(chatUpdate) {
  if (!chatUpdate?.messages) return

  for (let raw of chatUpdate.messages) {
    let m = smsg(this, raw)
    if (!m || m.fromMe || !m.text) continue

    const text = m.text
    const prefixes = Array.isArray(global.prefixes)
      ? global.prefixes
      : [global.prefix || "."]

    const first = text[0]
    let usedPrefix = null
    let command = ""
    let args = []

    if (prefixes.includes(first)) {
      usedPrefix = first
      const body = text.slice(1).trim()
      if (!body) continue
      args = body.split(/\s+/)
      command = args.shift().toLowerCase()
    } else continue

    const senderNumber = DIGITS(m.sender)
    const isROwner = OWNER_NUMBERS.includes(senderNumber)
    const isOwner = isROwner || m.fromMe

    let groupMetadata
    let participants
    let isAdmin = false
    let isBotAdmin = !m.isGroup

    const loadGroupData = async () => {
      if (!m.isGroup) return
      let cached = global.groupMetaCache.get(m.chat)
      if (!cached) {
        cached = {
          ts: Date.now(),
          meta: await this.groupMetadata(m.chat)
        }
        global.groupMetaCache.set(m.chat, cached)
      }

      groupMetadata = cached.meta
      participants = groupMetadata.participants || []

      const userP = participants.find(p => p.id === m.sender)
      const botP = participants.find(p => p.id === this.user.jid)

      isAdmin = userP?.admin
      isBotAdmin = botP?.admin
    }

    for (const plugin of Object.values(global.plugins)) {
      if (!plugin || plugin.disabled) continue

      let match = false

      if (plugin.command instanceof RegExp) match = plugin.command.test(command)
      else if (Array.isArray(plugin.command)) match = plugin.command.includes(command)
      else match = plugin.command === command

      if (!match) continue

      if (plugin.group || plugin.admin || plugin.botAdmin)
        await loadGroupData()

      if (plugin.rowner && !isROwner) return global.dfail("rowner", m, this)
      if (plugin.owner && !isOwner) return global.dfail("owner", m, this)
      if (plugin.group && !m.isGroup) return global.dfail("group", m, this)
      if (plugin.botAdmin && !isBotAdmin) return global.dfail("botAdmin", m, this)
      if (plugin.admin && !isAdmin) return global.dfail("admin", m, this)

      const exec = typeof plugin === "function" ? plugin : plugin.default
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
        chat: m.chat
      })

      break
    }
  }
}

if (process.env.NODE_ENV === "development") {
  const file = fileURLToPath(import.meta.url)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.magenta("handler.js actualizado"))
  })
}
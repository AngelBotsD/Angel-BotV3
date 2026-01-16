import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import fs from "fs"
import chalk from "chalk"
import fetch from "node-fetch"

const DIGITS = s => String(s || "").replace(/\D/g, "")
const PREFIX = "." // 🔥 prefijo fijo (más rápido)

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
  return ICON_BUFFER ? {
    contextInfo: {
      externalAdReply: {
        title: global.namebot || "𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍",
        body: global.author,
        thumbnail: ICON_BUFFER,
        mediaType: 1,
        renderLargerThumbnail: false
      }
    }
  } : {}
}

global.dfail = async (type, m, conn) => {
  const msg = {
    rowner: "Este comando solo puede usarlo mi creador",
    owner: "Este comando solo puede usarlo mi creador",
    mods: "Solo desarrolladores",
    premium: "Solo usuarios premium",
    group: "Este comando solo funciona en grupos",
    private: "Este comando solo funciona en privado",
    admin: "Solo admins del grupo",
    botAdmin: "Necesito ser admin",
    restrict: "Comando deshabilitado"
  }[type]
  if (msg) {
    await conn.sendMessage(m.chat, { text: msg }, { quoted: m, ...dialogContext() })
  }
}

global.groupPermCache ||= new Map()
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of global.groupPermCache) {
    if (now - v.ts > 60000) global.groupPermCache.delete(k)
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

async function handleMessage(raw) {
  let m = smsg(this, raw)
  if (!m || m.isBaileys || !m.text) return

  const text = m.text
  if (text[0] !== PREFIX) return

  const body = text.slice(1).trim()
  if (!body) return

  const [command, ...args] = body.split(/\s+/)
  const cmd = command.toLowerCase()

  let plugin = global.commandMap.get(cmd)

  if (!plugin) {
    for (const p of global.regexPlugins) {
      if (p.command.test(body)) {
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
  let groupMetadata, participants

  if (m.isGroup && (plugin.admin || plugin.botAdmin || plugin.group)) {
    let cached = global.groupPermCache.get(m.chat)
    if (!cached) {
      const meta = await this.groupMetadata(m.chat)
      const admins = new Set()
      const botNum = DIGITS(this.user.jid)
      let botAdmin = false

      for (const p of meta.participants) {
        if (!p.admin) continue
        const id = DIGITS(p.id || p.jid)
        admins.add(id)
        if (id === botNum) botAdmin = true
      }

      cached = { ts: Date.now(), admins, botAdmin, meta }
      global.groupPermCache.set(m.chat, cached)
    }

    groupMetadata = cached.meta
    participants = groupMetadata.participants
    isAdmin = cached.admins.has(senderNumber)
    isBotAdmin = cached.botAdmin
  }

  if (plugin.rowner && !isROwner) return global.dfail("rowner", m, this)
  if (plugin.owner && !isOwner) return global.dfail("owner", m, this)
  if (plugin.group && !m.isGroup) return global.dfail("group", m, this)
  if (plugin.botAdmin && !isBotAdmin) return global.dfail("botAdmin", m, this)
  if (plugin.admin && !isAdmin) return global.dfail("admin", m, this)

  const exec = typeof plugin === "function" ? plugin : plugin.default
  if (exec) {
    exec.call(this, m, {
      conn: this,
      args,
      command: cmd,
      isOwner,
      isROwner,
      isAdmin,
      isBotAdmin,
      groupMetadata,
      participants,
      chat: m.chat
    })
  }
}

if (process.env.NODE_ENV === "development") {
  const file = fileURLToPath(import.meta.url)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.green("handler.js actualizado"))
  })
}
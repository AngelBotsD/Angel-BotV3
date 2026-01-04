import { smsg } from "./lib/simple.js"
import { format } from "util"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import fetch from "node-fetch"
import ws from "ws"

const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))
const DIGITS = (s = "") => String(s).replace(/\D/g, "")

const OWNER_NUMBERS = (global.owner || []).map(v =>
  Array.isArray(v) ? DIGITS(v[0]) : DIGITS(v)
)

function isOwnerBySender(sender) {
  return OWNER_NUMBERS.includes(DIGITS(sender))
}

global.handledMessages ||= new Map()
global.recentCommands ||= new Map()
global.groupMetaCache ||= new Map()

export async function handler(chatUpdate) {
  this.msgqueque = this.msgqueque || []
  this.uptime = this.uptime || Date.now()
  if (!chatUpdate) return

  this.pushMessage(chatUpdate.messages).catch(console.error)

  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) return

  if (m?.key?.id) {
    const prev = global.handledMessages.get(m.key.id)
    if (prev && Date.now() - prev < 120000) return
    global.handledMessages.set(m.key.id, Date.now())
  }

  if (Math.random() < 0.05) {
    for (const [k, v] of global.handledMessages) {
      if (Date.now() - v > 120000) global.handledMessages.delete(k)
    }
    for (const [k, v] of global.recentCommands) {
      if (Date.now() - v > 60000) global.recentCommands.delete(k)
    }
    for (const [k, v] of global.groupMetaCache) {
      if (Date.now() - v.ts > 15000) global.groupMetaCache.delete(k)
    }
  }

  if (global.db.data == null)
    await global.loadDatabase()

  try {
    m = smsg(this, m) || m
    if (!m) return

    m.exp = 0
    if (typeof m.text !== "string") m.text = ""

    try {
      const st =
        m.message?.stickerMessage ||
        m.message?.ephemeralMessage?.message?.stickerMessage ||
        null

      if (st && m.isGroup) {
        const jsonPath = "./comandos.json"
        if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, "{}")

        const map = JSON.parse(fs.readFileSync(jsonPath, "utf-8") || "{}")
        const groupMap = map[m.chat]
        if (!groupMap) return

        const rawSha =
          st.fileSha256 ||
          st.fileSha256Hash ||
          st.filehash

        const candidates = []

        if (rawSha) {
          if (Buffer.isBuffer(rawSha)) candidates.push(rawSha.toString("base64"))
          else if (ArrayBuffer.isView(rawSha)) candidates.push(Buffer.from(rawSha).toString("base64"))
          else if (typeof rawSha === "string") candidates.push(rawSha)
        }

        let mapped = null
        for (const k of candidates) {
          if (groupMap[k] && groupMap[k].trim()) {
            mapped = groupMap[k].trim()
            break
          }
        }

        if (mapped) {
          const pref = (Array.isArray(global.prefixes) && global.prefixes[0]) || "."
          m.text = (mapped.startsWith(pref) ? mapped : pref + mapped).toLowerCase()
          m.isCommand = true
        }
      }
    } catch {}

    const user = global.db.data.users[m.sender] ||= {
      name: m.name,
      exp: 0,
      level: 0,
      health: 100,
      genre: "",
      birth: "",
      marry: "",
      description: "",
      packstickers: null,
      premium: false,
      premiumTime: 0,
      banned: false,
      bannedReason: "",
      commands: 0,
      afk: -1,
      afkReason: "",
      warn: 0
    }

    const chat = global.db.data.chats[m.chat] ||= {
      isBanned: false,
      isMute: false,
      welcome: false,
      sWelcome: "",
      sBye: "",
      detect: true,
      primaryBot: null,
      modoadmin: false,
      antiLink: true,
      nsfw: false
    }

    const settings = global.db.data.settings[this.user.jid] ||= {
      self: false,
      restrict: true,
      antiPrivate: false,
      gponly: false
    }

    const isROwner = isOwnerBySender(m.sender)
    const isOwner = isROwner || m.fromMe
    const isPrems = isROwner || user.premium === true
    const isOwners = isROwner || m.sender === this.user.jid

    if (settings.self && !isOwners) return
    if (m.isBaileys) return

    let groupMetadata = {}
    let participants = []
    let userGroup = {}
    let botGroup = {}
    let isRAdmin = false
    let isAdmin = false
    let isBotAdmin = false

    if (m.isGroup) {
      let cached = global.groupMetaCache.get(m.chat)
      if (!cached || Date.now() - cached.ts > 15000) {
        const meta = await this.groupMetadata(m.chat)
        cached = { ts: Date.now(), meta }
        global.groupMetaCache.set(m.chat, cached)
      }

      groupMetadata = cached.meta
      participants = groupMetadata.participants || []

      const userParticipant = participants.find(p => p.id === m.sender || p.jid === m.sender)
      const botParticipant = participants.find(p => p.id === this.user.jid || p.jid === this.user.jid)

      isRAdmin =
        userParticipant?.admin === "superadmin" ||
        DIGITS(m.sender) === DIGITS(groupMetadata.owner)

      isAdmin = isRAdmin || userParticipant?.admin === "admin"
      isBotAdmin = botParticipant?.admin === "admin" || botParticipant?.admin === "superadmin"

      userGroup = userParticipant || {}
      botGroup = botParticipant || {}
    }

    let usedPrefix = ""
    const ___dirname = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "plugins"
    )

    const hasPrefix =
      m.text.startsWith((Array.isArray(global.prefixes) && global.prefixes[0]) || ".")

    for (const name in global.plugins) {
      const plugin = global.plugins[name]
      if (!plugin || plugin.disabled) continue

      if (!hasPrefix && typeof plugin.all !== "function" && !m.isCommand) continue

      const __filename = join(___dirname, name)

      if (typeof plugin.all === "function") {
        try {
          await plugin.all.call(this, m, {
            chatUpdate,
            __dirname: ___dirname,
            __filename,
            user,
            chat,
            settings
          })
        } catch {}
      }

      const pluginPrefix = plugin.customPrefix || this.prefix || global.prefix

      const match =
        typeof pluginPrefix === "string"
          ? [[new RegExp(pluginPrefix).exec(m.text), new RegExp(pluginPrefix)]]
          : [[[], new RegExp]]

      if (!match) continue

      if ((usedPrefix = (match[0] || "")[0])) {
        const noPrefix = m.text.replace(usedPrefix, "")
        let [command, ...args] = noPrefix.trim().split(" ")
        command = (command || "").toLowerCase()

        const rateKey = m.sender + ":" + command
        const last = global.recentCommands.get(rateKey)
        if (last && Date.now() - last < 1200) return
        global.recentCommands.set(rateKey, Date.now())

        if (!plugin.command) continue

        const isAccept =
          plugin.command instanceof RegExp
            ? plugin.command.test(command)
            : Array.isArray(plugin.command)
              ? plugin.command.includes(command)
              : plugin.command === command

        if (!isAccept) continue

        m.isCommand = true
        user.commands++

        if (plugin.admin && !isAdmin) return
        if (plugin.botAdmin && !isBotAdmin) return
        if (plugin.owner && !isOwner) return
        if (plugin.premium && !isPrems) return
        if (plugin.group && !m.isGroup) return

        await plugin.call(this, m, {
          args,
          command,
          conn: this,
          participants,
          groupMetadata,
          userGroup,
          botGroup,
          isROwner,
          isOwner,
          isAdmin,
          isBotAdmin,
          isPrems,
          chat,
          user,
          settings
        })
      }
    }
  } catch (err) {
    console.error(err)
  }
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.magenta("Se actualizo 'handler.js'"))
  if (global.reloadHandler)
    console.log(await global.reloadHandler())
})
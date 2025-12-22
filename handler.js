import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import ws from "ws"

const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

const normalize = jid =>
  jid?.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

export async function handler(chatUpdate) {
  this.msgqueque = this.msgqueque || []
  this.uptime = this.uptime || Date.now()
  if (!chatUpdate) return

  this.pushMessage(chatUpdate.messages).catch(console.error)
  let m = chatUpdate.messages.at(-1)
  if (!m) return

  if (global.db.data == null) await global.loadDatabase()

  try {
    m = smsg(this, m)
    if (!m) return
    m.exp = 0
  } catch { return }

  if (typeof m.text !== "string") m.text = ""

  /* ================= DATABASE ================= */
  const user = global.db.data.users[m.sender] ||= {
    name: m.name,
    exp: 0,
    coin: 0,
    bank: 0,
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
    nsfw: false,
    economy: true,
    gacha: true
  }

  const settings = global.db.data.settings[this.user.jid] ||= {
    self: false,
    restrict: true,
    jadibotmd: true,
    antiPrivate: false,
    gponly: false
  }

  /* ================= ROLES ================= */
  const isROwner = global.owner.map(v => normalize(v)).includes(m.sender)
  const isOwner = isROwner || m.fromMe
  const isPrems =
    isROwner ||
    global.prems?.map(v => normalize(v)).includes(m.sender) ||
    user.premium === true

  if (settings.self && !isOwner) return
  if (
    settings.gponly &&
    !isOwner &&
    !m.isGroup &&
    !/^(ping|menu|help|estado|status|infobot|botinfo)$/i.test(m.text)
  ) return

  /* ================= GROUP DATA ================= */
  let groupMetadata = {}
  let participants = []
  let isRAdmin = false
  let isAdmin = false
  let isBotAdmin = false
  let userGroup = {}
  let botGroup = {}

  if (m.isGroup) {
    try {
      groupMetadata = await this.groupMetadata(m.chat)
      participants = groupMetadata.participants || []

      const userP = participants.find(p => p.id === m.sender)
      const botP = participants.find(p => p.id === this.user.jid)

      isRAdmin =
        userP?.admin === "superadmin" ||
        m.sender === groupMetadata.owner

      isAdmin = isRAdmin || userP?.admin === "admin"
      isBotAdmin =
        botP?.admin === "admin" ||
        botP?.admin === "superadmin"

      userGroup = userP || {}
      botGroup = botP || {}
    } catch (e) {
      console.error("Error metadata:", e)
    }
  }

  /* ================= PLUGINS ================= */
  const __dirname = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "plugins"
  )

  for (const name in global.plugins) {
    const plugin = global.plugins[name]
    if (!plugin || plugin.disabled) continue

    const __filename = join(__dirname, name)

    if (typeof plugin.all === "function") {
      try {
        await plugin.all.call(this, m, {
          chatUpdate,
          __dirname,
          __filename,
          user,
          chat,
          settings
        })
      } catch (e) {
        console.error(e)
      }
    }

    const pluginPrefix = plugin.customPrefix || global.prefix
    const match = Array.isArray(pluginPrefix)
      ? pluginPrefix.map(p => [new RegExp(`^${p}`), p])
      : [[new RegExp(`^${pluginPrefix}`), pluginPrefix]]

    const usedPrefix = match.find(p => p[0].test(m.text))?.[1]
    if (!usedPrefix) continue

    const noPrefix = m.text.slice(usedPrefix.length).trim()
    const [command, ...args] = noPrefix.split(/\s+/)
    const text = args.join(" ").trim()

    const isAccept =
      plugin.command instanceof RegExp
        ? plugin.command.test(command)
        : Array.isArray(plugin.command)
        ? plugin.command.includes(command)
        : plugin.command === command

    if (!isAccept) continue

    if (chat.isBanned && !isROwner) {
      await m.reply(
        `ꕥ El bot está desactivado en este grupo\nUsa ${usedPrefix}bot on`
      )
      return
    }

    if (user.banned && !isROwner) {
      await m.reply(
        `ꕥ Estás baneado\nRazón: ${user.bannedReason || "—"}`
      )
      return
    }

    const fail = plugin.fail || global.dfail

    if (plugin.rowner && !isROwner) return fail("rowner", m, this)
    if (plugin.owner && !isOwner) return fail("owner", m, this)
    if (plugin.premium && !isPrems) return fail("premium", m, this)
    if (plugin.group && !m.isGroup) return fail("group", m, this)
    if (plugin.admin && !isAdmin) return fail("admin", m, this)
    if (plugin.botAdmin && !isBotAdmin) return fail("botAdmin", m, this)
    if (plugin.private && m.isGroup) return fail("private", m, this)

    m.isCommand = true
    user.commands++

    try {
      await plugin.call(this, m, {
        usedPrefix,
        command,
        args,
        text,
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
        __dirname,
        __filename,
        user,
        chat,
        settings
      })
    } catch (e) {
      console.error(e)
    }
  }

  user.exp += m.exp
}

global.dfail = (type, m, conn) => {
  const msg = {
    rowner: "*Comando solo para el creador*",
    owner: "*Solo el owner puede usar esto*",
    premium: "*Comando premium*",
    group: "*Solo funciona en grupos*",
    private: "*Solo en privado*",
    admin: "*Solo admins*",
    botAdmin: "*Necesito ser admin*",
    restrict: "*Comando deshabilitado*"
  }[type]

  if (msg) conn.reply(m.chat, msg, m)
}

const file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.magenta("Handler actualizado"))
  if (global.reloadHandler) console.log(await global.reloadHandler())
})
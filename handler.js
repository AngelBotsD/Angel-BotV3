import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"

const strRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "plugins")

global.processedMessages ||= new Set()
global.groupCache ||= new Map()
global.prefixRegexCache ||= new Map()
global.stickerCmdMap ||= null
global.ownerCache ||= new Set(global.owner.map(v => v.replace(/\D/g, "") + "@lid"))
global.premsCache ||= new Set(global.prems.map(v => v.replace(/\D/g, "") + "@lid"))

const globalPrefixes = Array.isArray(global.prefix) ? global.prefix : [global.prefix]

export async function handler(chatUpdate) {
if (!chatUpdate?.messages?.length) return
let m = chatUpdate.messages.at(-1)
if (!m || m.key?.fromMe) return

if (global.processedMessages.has(m.key.id)) return
global.processedMessages.add(m.key.id)
setTimeout(() => global.processedMessages.delete(m.key.id), 60000)

if (global.db.data == null) await global.loadDatabase()
m = smsg(this, m)
if (!m) return
if (typeof m.text !== "string") m.text = ""

const users = global.db.data.users
const chats = global.db.data.chats
const settingsDB = global.db.data.settings

const user = users[m.sender] ||= { name: m.name, premium: false }
const chat = chats[m.chat] ||= { modoadmin: false }
const settings = settingsDB[this.user.jid] ||= { self: false }

const isROwner = global.ownerCache.has(m.sender)
const isOwner = isROwner || m.fromMe
const isPrems = isROwner || global.premsCache.has(m.sender) || user.premium

if (settings.self && !isOwner) return
if (m.isBaileys) return

let groupMetadata = {}
let participants = []
let userGroup = {}
let botGroup = {}
let isAdmin = false
let isRAdmin = false
let isBotAdmin = false

if (m.isGroup) {
groupMetadata = await this.groupMetadata(m.chat)
participants = groupMetadata.participants || []
userGroup = participants.find(p => p.id === m.sender) || {}
botGroup = participants.find(p => p.id === this.user.jid) || {}
isRAdmin = userGroup.admin === "superadmin" || m.sender === groupMetadata.owner
isAdmin = isRAdmin || userGroup.admin === "admin"
isBotAdmin = botGroup.admin === "admin" || botGroup.admin === "superadmin"
}

/* ================== LOOP PLUGINS ================== */

for (const name in global.plugins) {
const plugin = global.plugins[name]
if (!plugin || plugin.disabled) continue

const __filename = join(___dirname, name)

/* plugin.all */
if (typeof plugin.all === "function") {
await plugin.all.call(this, m, { chatUpdate }).catch(() => {})
}

/* -------- PREFIJO (LÓGICA ANTIGUA) -------- */

let usedPrefix = null
let match = null

const prefixList = plugin.customPrefix || globalPrefixes
const prefixes = Array.isArray(prefixList) ? prefixList : [prefixList]

for (const p of prefixes) {
let r = global.prefixRegexCache.get(p)
if (!r) {
r = p instanceof RegExp ? p : new RegExp("^" + strRegex(p))
global.prefixRegexCache.set(p, r)
}
match = r.exec(m.text)
if (match) {
usedPrefix = match[0]
break
}
}

/* sin prefijo permitido */
const noPrefixText = usedPrefix
? m.text.slice(usedPrefix.length).trim()
: m.text.trim()

let [command, ...args] = noPrefixText.split(/\s+/)
command = (command || "").toLowerCase()
const text = args.join(" ")

/* -------- VALIDAR COMANDO -------- */

const accept =
plugin.command instanceof RegExp
? plugin.command.test(command)
: Array.isArray(plugin.command)
? plugin.command.includes(command)
: plugin.command === command

if (!accept) continue

/* -------- FAIL -------- */

const fail = plugin.fail || ((type) => {
const msg = {
owner: "Solo el owner",
rowner: "Solo el creador",
premium: "Solo premium",
group: "Solo en grupos",
private: "Solo privado",
admin: "Solo admins",
botAdmin: "Necesito admin"
}[type]
if (msg) this.reply(m.chat, msg, m)
})

if (plugin.rowner && !isROwner) { fail("rowner"); continue }
if (plugin.owner && !isOwner) { fail("owner"); continue }
if (plugin.premium && !isPrems) { fail("premium"); continue }
if (plugin.group && !m.isGroup) { fail("group"); continue }
if (plugin.private && m.isGroup) { fail("private"); continue }
if (plugin.botAdmin && !isBotAdmin) { fail("botAdmin"); continue }
if (plugin.admin && !isAdmin) { fail("admin"); continue }

/* -------- EJECUTAR -------- */

await plugin.call(this, m, {
usedPrefix: usedPrefix || "",
args,
command,
text,
conn: this,
participants,
groupMetadata,
userGroup,
botGroup,
isROwner,
isOwner,
isRAdmin,
isAdmin,
isBotAdmin,
isPrems,
user,
chat,
settings
}).catch(console.error)

}
}

/* hot reload */
let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
unwatchFile(file)
console.log(chalk.magenta("Se actualizó handler.js"))
if (global.reloadHandler) console.log(await global.reloadHandler())
})
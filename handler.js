import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import ws from "ws"

const strRegex = str => str.replace(/[|{}()[]^$+*?.]/g, "$&")
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

const id = m.key.id
if (global.processedMessages.has(id)) return
global.processedMessages.add(id)
setTimeout(() => global.processedMessages.delete(id), 60000)

if (global.db.data == null) await global.loadDatabase()
m = smsg(this, m)
if (!m) return
if (typeof m.text !== "string") m.text = ""

const users = global.db.data.users
const chats = global.db.data.chats
const settingsDB = global.db.data.settings

const user = users[m.sender] ||= {
name: m.name,
premium: false,
banned: false,
bannedReason: "",
commands: 0
}

const chat = chats[m.chat] ||= {
isBanned: false,
isMute: false,
welcome: false,
sWelcome: "",
sBye: "",
detect: true,
primaryBot: null,
modoadmin: false,
antiLink: true
}

const settings = settingsDB[this.user.jid] ||= {
self: false,
restrict: true,
jadibotmd: true,
antiPrivate: false,
gponly: false
}

const isROwner = global.ownerCache.has(m.sender)
const isOwner = isROwner || m.fromMe
const isPrems = isROwner || global.premsCache.has(m.sender) || user.premium
const isOwners = isOwner || m.sender === this.user.jid

if (settings.self && !isOwners) return
if (m.isBaileys) return

let groupMetadata = {}
let participants = []
let userGroup = {}
let botGroup = {}
let isAdmin = false
let isRAdmin = false
let isBotAdmin = false

if (m.isGroup) {
const cache = global.groupCache.get(m.chat)
if (cache && Date.now() - cache.time < 90000) {
groupMetadata = cache.data
} else {
groupMetadata = await this.groupMetadata(m.chat)
global.groupCache.set(m.chat, { data: groupMetadata, time: Date.now() })
}

participants = groupMetadata.participants || []
userGroup = participants.find(p => p.id === m.sender) || {}
botGroup = participants.find(p => p.id === this.user.jid) || {}

isRAdmin = userGroup.admin === "superadmin" || m.sender === groupMetadata.owner
isAdmin = isRAdmin || userGroup.admin === "admin"
isBotAdmin = botGroup.admin === "admin" || botGroup.admin === "superadmin"
}

try {
const st = m.message?.stickerMessage
if (st) {
if (!global.stickerCmdMap) {
try {
global.stickerCmdMap = JSON.parse(fs.readFileSync("./comandos.json", "utf-8"))
} catch {
global.stickerCmdMap = {}
}
}
const sha = st.fileSha256
if (sha) {
const key = Buffer.isBuffer(sha) ? sha.toString("base64") : sha
const cmd = global.stickerCmdMap[key]
if (cmd) {
m.text = cmd.startsWith(globalPrefixes[0]) ? cmd : globalPrefixes[0] + cmd
}
}
}
} catch {}

const hasPrefix = globalPrefixes.some(p =>
p instanceof RegExp ? p.test(m.text) : m.text.startsWith(p)
)

for (const name in global.plugins) {
const plugin = global.plugins[name]
if (!plugin || plugin.disabled) continue

const __filename = join(___dirname, name)

/* plugin.all SIEMPRE */
if (typeof plugin.all === "function") {
await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename, user, chat, settings }).catch(() => {})
}

/* ---------- COMANDO CON O SIN PREFIJO ---------- */

let usedPrefix = ""
let noPrefixText = m.text.trim()

if (hasPrefix) {
for (const p of globalPrefixes) {
if (m.text.startsWith(p)) {
usedPrefix = p
noPrefixText = m.text.slice(p.length).trim()
break
}
}
}

let [command, ...args] = noPrefixText.split(/\s+/)
command = (command || "").toLowerCase()
const text = args.join(" ")

const accept =
plugin.command instanceof RegExp
? plugin.command.test(command)
: Array.isArray(plugin.command)
? plugin.command.includes(command)
: plugin.command === command

if (!accept) continue

/* -------- VALIDACIONES (YA MANDA FAIL) -------- */

const fail = plugin.fail || ((type, m, conn, rcanal = null) => {
const msg = {
rowner: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋",
owner: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋",
premium: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖤𝗌 𝖯𝖺𝗋𝖺 𝖴𝗌𝗎𝖺𝗋𝗂𝗈𝗌 𝖯𝗋𝖾𝗆𝗂𝗎𝗆",
group: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖥𝗎𝗇𝖼𝗂𝗈𝗇𝖺 𝖤𝗇 𝖦𝗋𝗎𝗉𝗈𝗌",
private: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖲𝖾 𝖴𝗌𝖺 𝖤𝗇 𝖯𝗋𝗂𝗏𝖺𝖽𝗈",
admin: "𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖤𝗌 𝖯𝖺𝗋𝖺 𝖠𝖽𝗆𝗂𝗇𝗌",
botAdmin: "𝖭𝖾𝖼𝖾𝗌𝗂𝗍𝗈 𝖲𝖾𝗋 𝖠𝖽𝗆𝗂𝗇"
}[type]
if (msg) return conn.reply(m.chat, msg, m, rcanal)
})

if (plugin.rowner && !isROwner) { fail("rowner", m, this); continue }
if (plugin.owner && !isOwner) { fail("owner", m, this); continue }
if (plugin.premium && !isPrems) { fail("premium", m, this); continue }
if (plugin.group && !m.isGroup) { fail("group", m, this); continue }
if (plugin.private && m.isGroup) { fail("private", m, this); continue }
if (plugin.botAdmin && !isBotAdmin) { fail("botAdmin", m, this); continue }
if (plugin.admin && !isAdmin) { fail("admin", m, this); continue }

/* ---------- EJECUTA ---------- */

await plugin.call(this, m, {
usedPrefix,
noPrefix: noPrefixText,
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
chatUpdate,
__dirname: ___dirname,
__filename,
user,
chat,
settings
}).catch(console.error)

}
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
unwatchFile(file)
console.log(chalk.magenta("Se actualizo 'handler.js'"))
if (global.reloadHandler) console.log(await global.reloadHandler())
})
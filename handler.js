import { smsg } from './lib/simple.js'
import { fileURLToPath } from 'url'
import path, { join } from 'path'

const DIGITS = (s = '') => String(s).replace(/\D/g, '')
const OWNER_NUMBERS = (global.owner || []).map(v =>
  Array.isArray(v) ? DIGITS(v[0]) : DIGITS(v)
)

const isOwnerBySender = sender => OWNER_NUMBERS.includes(DIGITS(sender))

global.dfail = (type, m, conn) => {
  const msg = {
    rowner: '*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋*',
    owner: '*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝖽𝗈 𝖯𝗈𝗋 𝖬𝗂 𝖢𝗋𝖾𝖺𝖽𝗈𝗋*',
    mods: '*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖽𝖾𝗌𝖺𝗋𝗋𝗈𝗅𝗅𝖺𝖽𝗈𝗋𝖾𝗌*',
    premium: '*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖫𝗈 𝖯𝗎𝖾𝖽𝖾𝗇 𝖴𝗍𝗂𝗅𝗂𝗓𝖺𝗋 𝖴𝗌𝗎𝖺𝗋𝗂𝗈𝗌 𝖯𝗋𝖾𝗆𝗂𝗎𝗆*',
    group: '*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖥𝗎𝗇𝖼𝗂𝗈𝗇𝖺 𝖤𝗇 𝖦𝗋𝗎𝗉𝗈𝗌*',
    private: '*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖲𝖾 𝖯𝗎𝖾𝖽𝖾 𝖮𝖼𝗎𝗉𝖺𝗋 𝖤𝗇 𝖤𝗅 𝖯𝗋𝗂𝗏𝖺𝖽𝗈*',
    admin: '*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖲𝗈𝗅𝗈 𝖯𝗎𝖾𝖽𝖾 𝖲𝖾𝗋 𝖴𝗌𝖺𝖽𝗈 𝖯𝗈𝗋 𝖠𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺𝖽𝗈𝗋𝖾𝗌*',
    botAdmin: '*𝖭𝖾𝖼𝖾𝗌𝗂𝗍𝗈 𝗌𝖾𝗋 𝖠𝖽𝗆𝗂𝗇 𝖯𝖺𝗋𝖺 𝖴𝗌𝖺𝗋 𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈*',
    restrict: '*𝖤𝗌𝗍𝖾 𝖢𝗈𝗆𝖺𝗇𝖽𝗈 𝖧𝖺 𝖲𝗂𝖽𝗈 𝖣𝖾𝗌𝖺𝖻𝗂𝗅𝗂𝗍𝖺𝖽𝗈*'
  }[type]

  if (msg) conn.reply(m.chat, msg, m, global.rcanal || {}).then(() => m.react('✖️'))
}

const fail = (type, m, conn) => global.dfail?.(type, m, conn)

global.handledMessages ||= new Map()
global.groupMetaCache ||= new Map()

let cachedRcanal = null

global.beforeAll = async function () {
  if (cachedRcanal) return cachedRcanal
  cachedRcanal = {
    contextInfo: {
      isForwarded: true,
      forwardingScore: 1,
      externalAdReply: {
        title: global.namebot,
        body: global.author,
        thumbnailUrl: global.banner,
        mediaType: 1,
        renderLargerThumbnail: false
      }
    }
  }
  return cachedRcanal
}

export async function handler(chatUpdate) {
  if (!chatUpdate?.messages?.length) return

  let m = chatUpdate.messages.at(-1)
  if (!m?.key?.id) return

  if (global.handledMessages.has(m.key.id)) return
  global.handledMessages.set(m.key.id, Date.now())

  if (global.db.data == null) await global.loadDatabase()

  m = smsg(this, m)
  if (!m) return

  m.text = typeof m.text === 'string' ? m.text : ''
  if (!m.text) return

  const user = global.db.data.users[m.sender] ||= {
    name: m.name,
    exp: 0,
    level: 0,
    premium: false,
    premiumTime: 0,
    banned: false,
    commands: 0
  }

  const chat = global.db.data.chats[m.chat] ||= {
    isBanned: false,
    isMute: false
  }

  const settings = global.db.data.settings[this.user.jid] ||= {
    self: false,
    restrict: true
  }

  const isROwner = isOwnerBySender(m.sender)
  const isOwner = isROwner || m.fromMe
  const isPrems = isROwner || user.premium

  let groupMetadata = {}
  let participants = []
  let isAdmin = false
  let isBotAdmin = false

  if (m.isGroup) {
    let cached = global.groupMetaCache.get(m.chat)
    if (!cached || Date.now() - cached.ts > 30000) {
      const meta = await this.groupMetadata(m.chat)
      cached = { ts: Date.now(), meta }
      global.groupMetaCache.set(m.chat, cached)
    }
    groupMetadata = cached.meta
    participants = groupMetadata.participants || []
    const userP = participants.find(p => p.id === m.sender)
    const botP = participants.find(p => p.id === this.user.jid)
    isAdmin = userP?.admin
    isBotAdmin = botP?.admin
  }

  const __dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), 'plugins')

  await global.beforeAll()

  for (const name in global.plugins) {
    const plugin = global.plugins[name]
    if (!plugin || plugin.disabled || !plugin.command) continue

    const prefixes = Array.isArray(global.prefixes) ? global.prefixes : [global.prefix || '.']
    const found = prefixes.find(p =>
      typeof p === 'string' ? m.text.startsWith(p) : p instanceof RegExp && p.test(m.text)
    )
    if (!found) continue

    const usedPrefix = found instanceof RegExp ? m.text.match(found)?.[0] : found
    const noPrefix = m.text.slice(usedPrefix.length)
    let [command, ...args] = noPrefix.trim().split(/\s+/)
    command = (command || '').toLowerCase()

    const isAccept = plugin.command instanceof RegExp
      ? plugin.command.test(command)
      : Array.isArray(plugin.command)
        ? plugin.command.includes(command)
        : plugin.command === command

    if (!isAccept) continue

    if (plugin.rowner && !isROwner) { fail('rowner', m, this); continue }
    if (plugin.owner && !isOwner) { fail('owner', m, this); continue }
    if (plugin.premium && !isPrems) { fail('premium', m, this); continue }
    if (plugin.group && !m.isGroup) { fail('group', m, this); continue }
    if (plugin.botAdmin && !isBotAdmin) { fail('botAdmin', m, this); continue }
    if (plugin.admin && !isAdmin) { fail('admin', m, this); continue }
    if (plugin.private && m.isGroup) { fail('private', m, this); continue }

    user.commands++

    await plugin.call(this, m, {
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
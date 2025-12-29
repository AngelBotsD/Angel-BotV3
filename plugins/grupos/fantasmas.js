import fs from "fs"

const FILE = "./fantasmas.json"
const TIMEOUT = 3 * 24 * 60 * 60 * 1000

let db = {}

try {
  db = JSON.parse(fs.readFileSync(FILE))
} catch {
  db = {}
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2))
}

export async function initFantasma(conn) {
  conn.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m?.message) return
    if (!m.key.remoteJid?.endsWith("@g.us")) return
    if (m.key.fromMe) return

    const group = m.key.remoteJid
    const user = m.key.participant
    if (!user) return

    if (!db[group]) db[group] = {}

    const metadata = await conn.groupMetadata(group)
    const isAdmin = metadata.participants.find(p => p.id === user)?.admin
    const botJid = conn.user.id.split(":")[0] + "@s.whatsapp.net"

    if (isAdmin || user === botJid) return

    db[group][user] = {
      last: Date.now(),
      ghost: false
    }

    save()
  })

  setInterval(() => checkGhosts(), 60 * 60 * 1000)
}

function checkGhosts() {
  const now = Date.now()

  for (const group in db) {
    for (const user in db[group]) {
      const u = db[group][user]
      if (!u.ghost && now - u.last >= TIMEOUT) {
        u.ghost = true
      }
    }
  }

  save()
}

export function getFantasmas(group) {
  if (!db[group]) return []
  return Object.entries(db[group])
    .filter(([_, v]) => v.ghost)
    .map(([jid]) => jid)
}

export async function fankick(conn, group) {
  const ghosts = getFantasmas(group)
  if (!ghosts.length) return 0
  await conn.groupParticipantsUpdate(group, ghosts, "remove")
  return ghosts.length
}

const handler = async (m, { conn, isAdmin, isOwner, command }) => {
  if (!m.chat.endsWith("@g.us")) return

  if (command === "fantasmas") {
    const list = getFantasmas(m.chat)
    if (!list.length) return m.reply("No hay fantasmas 👻")

    let txt = "👻 *Fantasmas del grupo*\n\n"
    for (const jid of list) {
      txt += `• @${jid.split("@")[0]}\n`
    }

    return m.reply(txt, null, { mentions: list })
  }

  if (command === "fankick") {
    if (!isAdmin && !isOwner) return
    const total = await fankick(conn, m.chat)
    if (!total) return m.reply("No hay fantasmas 👻")
    return m.reply(`👻 ${total} fantasmas eliminados`)
  }
}

handler.command = ["fantasmas", "fankick"]
handler.group = true
handler.admin = true

export default handler
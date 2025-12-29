import fs from "fs"

const FILE = "./fantasmas.json"
const TIMEOUT = 3 * 24 * 60 * 60 * 1000

let db = {}

if (fs.existsSync(FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(FILE))
  } catch {
    db = {}
  }
} else {
  fs.writeFileSync(FILE, JSON.stringify({}, null, 2))
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

    const groupJid = m.key.remoteJid
    const sender = m.key.participant
    if (!sender) return

    const metadata = await conn.groupMetadata(groupJid)
    const participant = metadata.participants.find(p => p.id === sender)
    if (!participant) return

    if (participant.admin) return
    if (sender === conn.user.id.split(":")[0] + "@s.whatsapp.net") return

    if (!db[groupJid]) db[groupJid] = {}

    db[groupJid][sender] = {
      last: Date.now(),
      ghost: false
    }

    save()
  })

  setInterval(() => checkGhosts(conn), 60 * 60 * 1000)
}

async function checkGhosts(conn) {
  const now = Date.now()

  for (const groupJid in db) {
    let metadata
    try {
      metadata = await conn.groupMetadata(groupJid)
    } catch {
      continue
    }

    const admins = metadata.participants
      .filter(p => p.admin)
      .map(p => p.id)

    for (const jid in db[groupJid]) {
      if (admins.includes(jid)) continue
      if (jid === conn.user.id.split(":")[0] + "@s.whatsapp.net") continue

      if (now - db[groupJid][jid].last >= TIMEOUT) {
        db[groupJid][jid].ghost = true
      }
    }
  }

  save()
}

export function getFantasmas(groupJid) {
  if (!db[groupJid]) return []

  return Object.entries(db[groupJid])
    .filter(([_, v]) => v.ghost)
    .map(([jid]) => jid)
}

export async function fankick(conn, groupJid) {
  const ghosts = getFantasmas(groupJid)
  if (!ghosts.length) return 0

  await conn.groupParticipantsUpdate(groupJid, ghosts, "remove")

  for (const jid of ghosts) {
    delete db[groupJid][jid]
  }

  save()
  return ghosts.length
}

/* ================= COMANDOS ================= */

const handler = async (m, { conn, isAdmin, isOwner, command }) => {
  if (!m.isGroup) return

  if (command === "fantasmas") {
    const list = getFantasmas(m.chat)
    if (!list.length) return m.reply("No hay fantasmas 👻")

    let txt = "👻 Usuarios Fantasmas\n\n"
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
handler.admin = false

export default handler
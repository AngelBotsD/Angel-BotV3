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

/* =========================
   SISTEMA PRINCIPAL
========================= */
export async function initFantasma(conn) {
  conn.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m?.message) return
    if (m.key.fromMe) return

    const chat = m.key.remoteJid
    if (!chat?.endsWith("@g.us")) return

    const user = m.key.participant
    if (!user) return

    if (!db[chat]) db[chat] = {}

    const metadata = await conn.groupMetadata(chat)
    const participant = metadata.participants.find(p => p.id === user)

    if (!participant) return
    if (participant.admin) return
    if (user === conn.user.id.split(":")[0] + "@s.whatsapp.net") return

    db[chat][user] = {
      last: Date.now(),
      ghost: false
    }

    save()
  })

  setInterval(() => checkGhosts(), 60 * 60 * 1000)
}

function checkGhosts() {
  const now = Date.now()

  for (const chat in db) {
    for (const user in db[chat]) {
      const u = db[chat][user]
      if (!u.ghost && now - u.last >= TIMEOUT) {
        u.ghost = true
      }
    }
  }
  save()
}

/* =========================
   OBTENER FANTASMAS
========================= */
export function getFantasmas(chat) {
  if (!db[chat]) return []

  return Object.entries(db[chat])
    .filter(([_, v]) => v.ghost)
    .map(([jid]) => jid)
}

/* =========================
   FANKICK
========================= */
export async function fankick(conn, chat) {
  const ghosts = getFantasmas(chat)
  if (!ghosts.length) return 0

  await conn.groupParticipantsUpdate(chat, ghosts, "remove")

  for (const jid of ghosts) {
    delete db[chat][jid]
  }

  save()
  return ghosts.length
}

/* =========================
   COMANDO .fantasmas
========================= */
const handler = async (m, { conn }) => {
  const list = getFantasmas(m.chat)
  if (!list.length) return m.reply("No hay fantasmas 👻")

  let txt = "👻 *Usuarios Fantasmas*\n\n"
  for (const jid of list) {
    txt += `• @${jid.split("@")[0]}\n`
  }

  await m.reply(txt, null, { mentions: list })
}

handler.command = ["fantasmas"]
handler.group = true
export default handler

/* =========================
   COMANDO .fankick
========================= */
export const fankickHandler = async (m, { conn, isAdmin, isOwner }) => {
  if (!isAdmin && !isOwner) return

  const total = await fankick(conn, m.chat)
  if (!total) return m.reply("No hay fantasmas 👻")

  m.reply(`👻 ${total} fantasmas eliminados`)
}

fankickHandler.command = ["fankick"]
fankickHandler.group = true
fankickHandler.admin = true
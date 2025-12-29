const TRES_DIAS = 1000 * 60 * 60 * 24 * 3

let handler = async (m, { conn }) => {

  if (!m.isGroup) return

  let id = m.chat
  let group = global.db.data.chats[id] || {}

  if (!group.fantasmas) group.fantasmas = {}

  let metadata = await conn.groupMetadata(id)
  let bot = conn.user.jid

  for (let p of metadata.participants) {
    let jid = p.id
    if (p.admin || jid === bot) continue
    if (!group.fantasmas[jid]) {
      group.fantasmas[jid] = { last: 0 }
    }
  }

  let sender = m.sender

  if (group.fantasmas[sender]) {
    group.fantasmas[sender].last = Date.now()
  }

  let fantasmas = []

  for (let jid in group.fantasmas) {

    let p = metadata.participants.find(u => u.id === jid)

    if (!p) {
      delete group.fantasmas[jid]
      continue
    }

    if (p.admin || jid === bot) continue

    let last = group.fantasmas[jid].last

    if (last === 0) {
      fantasmas.push(jid)
      continue
    }

    if (Date.now() - last >= TRES_DIAS) {
      fantasmas.push(jid)
    }
  }

  if (/^\.fantasmas$/i.test(m.text || "")) {

    if (!fantasmas.length) {
      return await conn.reply(id, "✨ No hay fantasmas ahora mismo", m)
    }

    let txt = "👻 LISTA DE FANTASMAS\n\n"
    txt += fantasmas.map(v => "• @" + v.split("@")[0]).join("\n")

    await conn.sendMessage(id, {
      text: txt,
      mentions: fantasmas
    }, { quoted: m })
  }
}

handler.command = ["fantasmas"]

export default handler
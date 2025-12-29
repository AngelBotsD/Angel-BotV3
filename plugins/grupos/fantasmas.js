// ===============================
//  SISTEMA FANTASMAS 👻
// ===============================
// Reglas:
// - TODOS inician como fantasmas
// - Cuando hablan → salen de la lista
// - Si pasan 3 días sin hablar → vuelven a ser fantasmas
// - NO cuenta admins
// - NO cuenta el bot
// ===============================

const TRES_DIAS = 1000 * 60 * 60 * 24 * 3

let handler = async (m, { conn }) => {

  if (!m.isGroup) return

  let id = m.chat
  let group = global.db.data.chats[id] || {}

  if (!group.fantasmas) group.fantasmas = {}

  let metadata = await conn.groupMetadata(id)
  let bot = conn.user.jid

  // ===============================
  //   MARCAR INACTIVOS
  // ===============================
  for (let p of metadata.participants) {
    let jid = p.id

    // ignorar admins y bot
    if (p.admin || jid === bot) continue

    if (!group.fantasmas[jid]) {
      group.fantasmas[jid] = {
        last: 0 // nunca habló
      }
    }
  }

  // ===============================
  //   SI EL USUARIO HABLA
  // ===============================
  let sender = m.sender

  if (group.fantasmas[sender]) {
    group.fantasmas[sender].last = Date.now()
  }

  // ===============================
  //   ACTUALIZAR LISTA
  // ===============================
  let fantasmas = []

  for (let jid in group.fantasmas) {
    let data = group.fantasmas[jid]
    let p = metadata.participants.find(u => u.id === jid)

    // si ya no está en el grupo → borrar
    if (!p) {
      delete group.fantasmas[jid]
      continue
    }

    // ignorar admins/bot
    if (p.admin || jid === bot) continue

    // nunca habló = sigue fantasma
    if (data.last === 0) {
      fantasmas.push(jid)
      continue
    }

    // si pasaron 3 días → vuelve a fantasma
    if (Date.now() - data.last >= TRES_DIAS) {
      fantasmas.push(jid)
    }
  }

  // ===============================
  //   SI USAN EL COMANDO
  // ===============================
  if (/^\.fantasmas$/i.test(m.text)) {

    if (!fantasmas.length)
      return await conn.reply(id, "✨ *No hay fantasmas ahora mismo*", m)

    let txt = `👻 *LISTA DE FANTASMAS*\n\n`
    txt += fantasmas.map(v => `• @${v.split("@")[0]}`).join("\n")

    await conn.sendMessage(id, {
      text: txt,
      mentions: fantasmas
    }, { quoted: m })
  }
}

handler.command = ["fantasmas"]

export default handler
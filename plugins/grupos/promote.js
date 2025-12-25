let handler = async (m, { conn, participants }) => {

  const tag = jid => `@${jid.split('@')[0]}`

  let user =
    m.mentionedJid?.[0] ||
    m.quoted?.sender

  if (!user) {
    return conn.sendMessage(m.chat, {
      text: '☁️ *Responde o menciona al usuario*.',
      contextInfo: {
        stanzaId: m.key.id,
        participant: m.sender,
        quotedMessage: m.message
      }
    }, { quoted: m })
  }

  const ok = []
  const alreadyAdmin = []
  const fail = []

  try {
    const p = participants.find(v => v.id === user || v.jid === user)

    if (p?.admin) {
      alreadyAdmin.push(user)
    } else {
      await conn.groupParticipantsUpdate(m.chat, [user], 'promote')
      ok.push(user)
    }
  } catch (e) {
    console.error(e)
    fail.push(user)
  }

  let lines = []
  if (ok.length) lines.push(`✅ *Admin dado a:* ${ok.map(tag).join(", ")}`)
  if (alreadyAdmin.length) lines.push(`ℹ️ *Ya era admin:* ${alreadyAdmin.map(tag).join(", ")}`)
  if (fail.length) lines.push(`❌ *Error al dar admin a:* ${fail.map(tag).join(", ")}`)

  await conn.sendMessage(m.chat, {
    text: lines.join('\n'),
    mentions: [...ok, ...alreadyAdmin, ...fail]
  }, { quoted: m })
}

handler.customPrefix = /^\.?(promote|daradmin|addadmin)/i
handler.command = new RegExp()
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
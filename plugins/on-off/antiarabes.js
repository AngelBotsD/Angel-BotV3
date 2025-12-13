let handler = m => m;

handler.before = async function (m, { conn }) {
  const prefijosProhibidos = ['91', '92', '222', '93', '234', '265', '61', '62', '966', '229', '40', '49', '20', '963', '967', '234', '210', '249', '212'];

  // SOLUCIÓN: Usar 'conn.user.jid' porque el handler ahora lo garantiza al pasar 'conn: this'.
  // Si conn.user no existiera, la condición se salta y evita el crash.
  const botJid = conn.user && conn.user.jid; 
  if (!botJid) return !0; // Si no hay JID, se sale sin hacer nada (evita crash)

  const bot = global.db.data.settings[botJid] || {};

  const senderNumber = m.sender.split('@')[0];
  const user = global.db.data.users[m.sender];

  if (m.fromMe) return;
  if (!bot.anticommand) return;
  if (user.banned) return !1;

  const esProhibido = prefijosProhibidos.some(prefijo => senderNumber.startsWith(prefijo));

  if (esProhibido) {
    user.banned = true;
    if (m.chat.endsWith('@g.us')) {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
    }
    await conn.updateBlockStatus(m.sender, 'block');
    return !1;
  }
  return !0;
};

export default handler;
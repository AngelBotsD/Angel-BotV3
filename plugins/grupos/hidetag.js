import { generateWAMessageFromContent, downloadContentFromMessage } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

const DIGITS = (s = "") => String(s || "").replace(/\D/g, "")

let thumb = null
fetch('https://files.catbox.moe/tx6prq.jpg')
  .then(r => r.arrayBuffer())
  .then(buf => thumb = Buffer.from(buf))
  .catch(() => null)

function unwrapMessage(m = {}) {
  let n = m;
  while (
    n?.viewOnceMessage?.message ||
    n?.viewOnceMessageV2?.message ||
    n?.viewOnceMessageV2Extension?.message ||
    n?.ephemeralMessage?.message
  ) {
    n =
      n.viewOnceMessage?.message ||
      n.viewOnceMessageV2?.message ||
      n.viewOnceMessageV2Extension?.message ||
      n.ephemeralMessage?.message;
  }
  return n;
}

function getMessageText(m) {
  const msg = unwrapMessage(m.message) || {};
  return (
    m.text ||
    m.msg?.caption ||
    msg?.extendedTextMessage?.text ||
    msg?.conversation ||
    ''
  );
}

async function downloadMedia(msgContent, type) {
  try {
    const stream = await downloadContentFromMessage(msgContent, type);
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
  } catch {
    return null;
  }
}

const handler = async (m, { conn, participants }) => {

  if (!m.isGroup || m.key.fromMe) return;

  const fkontak = {
    key: { remoteJid: m.chat, fromMe: false, id: 'Angel' },
    message: {
      locationMessage: {
        name: "𝖧𝗈𝗅𝖺, 𝖲𝗈𝗒 𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍",
        jpegThumbnail: thumb
      }
    },
    participant: '0@s.whatsapp.net'
  };

  const content = getMessageText(m);
  if (!/^\.?n(\s|$)/i.test(content.trim())) return;

  await conn.sendMessage(m.chat, { react: { text: '🗣️', key: m.key } });

  const seen = new Set();
  const users = [];
  for (const p of participants) {
    const jid = conn.decodeJid(p.id);
    if (!seen.has(jid)) {
      seen.add(jid);
      users.push(jid);
    }
  }

  const q = m.quoted ? unwrapMessage(m.quoted) : unwrapMessage(m);
  const mtype = q.mtype || Object.keys(q.message || {})[0] || '';

  // 🟡 NUEVO — detectar encuesta
  const isPoll = [
    'pollCreationMessage',
    'pollUpdateMessage',
    'pollVoteMessage'
  ].includes(mtype);

  // 🟢 media válida SOLO si NO es encuesta
  const isMedia = !isPoll && [
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'stickerMessage'
  ].includes(mtype);

  // texto que escribió el admin
  const userText = content.trim().replace(/^\.?n(\s|$)/i, '');

  // caption original SOLO si NO es encuesta
  const originalCaption = (!isPoll && (q.msg?.caption || q.text || '').trim()) || '';

  // prioridad:
  // 1️⃣ userText
  // 2️⃣ caption
  // 3️⃣ fallback
  const finalCaption = userText || originalCaption || '🔊 Notificación';

  try {

    // 📎 SI ES MEDIA
    if (isMedia) {

      let buffer = null;

      if (q[mtype]) {
        const detected = mtype.replace('Message', '').toLowerCase();
        buffer = await downloadMedia(q[mtype], detected);
      }

      if (!buffer && q.download) buffer = await q.download();

      const msg = { mentions: users };

      if (mtype === 'audioMessage') {
        msg.audio = buffer;
        msg.mimetype = 'audio/mpeg';
        msg.ptt = false;

        await conn.sendMessage(m.chat, msg, { quoted: fkontak });

        if (userText) {
          await conn.sendMessage(m.chat, { text: userText, mentions: users }, { quoted: fkontak });
        }
        return;
      }

      if (mtype === 'imageMessage') {
        msg.image = buffer;
        msg.caption = finalCaption;

      } else if (mtype === 'videoMessage') {
        msg.video = buffer;
        msg.caption = finalCaption;
        msg.mimetype = 'video/mp4';

      } else if (mtype === 'stickerMessage') {
        msg.sticker = buffer;
      }

      return await conn.sendMessage(m.chat, msg, { quoted: fkontak });
    }

    // 🟣 SI ES ENCUESTA → SOLO TEXTO
    if (isPoll) {
      return await conn.sendMessage(
        m.chat,
        { text: finalCaption, mentions: users },
        { quoted: fkontak }
      );
    }

    // 📝 SI ES TEXTO COMÚN
    if (m.quoted && !isMedia) {

      const newMsg = conn.cMod(
        m.chat,
        generateWAMessageFromContent(
          m.chat,
          {
            [mtype || 'extendedTextMessage']:
              q?.message?.[mtype] || { text: finalCaption }
          },
          { quoted: fkontak, userJid: conn.user.id }
        ),
        finalCaption,
        conn.user.jid,
        { mentions: users }
      );

      return await conn.relayMessage(
        m.chat,
        newMsg.message,
        { messageId: newMsg.key.id }
      );
    }

    // mensaje normal
    return await conn.sendMessage(
      m.chat,
      { text: finalCaption, mentions: users },
      { quoted: fkontak }
    );

  } catch (err) {

    return await conn.sendMessage(
      m.chat,
      { text: '🔊 Notificación', mentions: users },
      { quoted: fkontak }
    );
  }
};

handler.help = ["𝖭𝗈𝗍𝗂𝖿𝗒"];
handler.tags = ["𝖦𝖱𝖴𝖯𝖮𝖲"];
handler.customPrefix = /^\.?n(\s|$)/i;
handler.command = new RegExp();
handler.group = true;
handler.admin = true;

export default handler;
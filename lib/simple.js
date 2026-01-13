import chalk from 'chalk'
import {
  default as makeWASocketBase,
  getContentType,
  jidDecode,
  downloadContentFromMessage
} from '@whiskeysockets/baileys'
import store from '../store.js'

const delay = ms => new Promise(res => setTimeout(res, ms))

const decodeCache = new Map()
function decodeJid(jid = '') {
  if (!jid) return jid
  if (decodeCache.has(jid)) return decodeCache.get(jid)
  let res = jid
  if (/:\d+@/gi.test(jid)) {
    const d = jidDecode(jid)
    if (d?.user && d?.server) res = d.user + '@' + d.server
  }
  decodeCache.set(jid, res)
  return res
}

function normalizeJid(jid = '') {
  return decodeJid(jid)
}

function smsg(conn, m) {
  if (!m) return m

  if (m.key) {
    m.id = m.key.id
    m.chat = decodeJid(m.key.remoteJid)
    m.fromMe = m.key.fromMe
    m.isGroup = m.chat.endsWith('@g.us')
    m.sender = decodeJid(
      m.fromMe
        ? conn.user.id
        : m.key.participant || m.chat
    )
  }

  if (m.message) {
    m.mtype = getContentType(m.message)
    m.msg = m.message[m.mtype]

    m.body =
      m.message.conversation ||
      m.msg?.text ||
      m.msg?.caption ||
      ''

    m.text = m.body

    m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []

    if (m.msg?.contextInfo?.quotedMessage) {
      const q = m.msg.contextInfo
      const qm = q.quotedMessage
      const type = getContentType(qm)

      m.quoted = {
        mtype: type,
        id: q.stanzaId,
        chat: decodeJid(q.remoteJid || m.chat),
        sender: decodeJid(q.participant),
        fromMe: decodeJid(q.participant) === decodeJid(conn.user.id),
        text:
          qm[type]?.text ||
          qm[type]?.caption ||
          ''
      }

      m.quoted.download = () =>
        downloadContentFromMessage(
          qm[type],
          type.replace('Message', '')
        )
    }
  }

  m.reply = (text, chat = m.chat, options = {}) =>
    conn.sendMessage(chat, { text, ...options }, { quoted: m })

  m.download = () =>
    downloadContentFromMessage(
      m.msg,
      m.mtype.replace('Message', '')
    )

  return m
}

function makeWASocket(opts = {}) {
  const sock = makeWASocketBase(opts)

  sock.decodeJid = decodeJid
  sock.normalizeJid = normalizeJid

  sock.logger = {
    info: (...a) => console.log(chalk.cyan('[INFO]'), ...a),
    warn: (...a) => console.log(chalk.yellow('[WARN]'), ...a),
    error: (...a) => console.log(chalk.red('[ERROR]'), ...a)
  }

  sock.smsg = m => smsg(sock, m)

  sock.sendSylph = (jid, text, quoted, options = {}) =>
    sock.sendMessage(jid, { text, ...options }, { quoted })

  sock.sendSylphy = sock.sendSylph

  sock.sendListB = (jid, title, text, footer, buttonText, sections, quoted) =>
    sock.sendMessage(
      jid,
      { title, text, footer, buttonText, sections },
      { quoted }
    )

  return sock
}

export {
  makeWASocket,
  smsg,
  delay,
  decodeJid,
  normalizeJid
}
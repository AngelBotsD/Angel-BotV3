import * as baileys from '@whiskeysockets/baileys'

const {
  makeWASocket,
  getContentType,
  jidDecode,
  downloadContentFromMessage
} = baileys

if (typeof makeWASocket !== 'function') {
  throw new Error(
    '[simple.js] makeWASocket no es función. Fork AngelBotsD/Baileys detectado.'
  )
}

const delay = ms => new Promise(res => setTimeout(res, ms))

const decodeCache = new Map()

function decodeJid(jid = '') {
  if (!jid) return jid
  if (decodeCache.has(jid)) return decodeCache.get(jid)

  let res = jid
  if (jid.includes(':') && jid.includes('@')) {
    const d = jidDecode(jid)
    if (d?.user && d?.server) res = d.user + '@' + d.server
  }

  decodeCache.set(jid, res)
  return res
}

function unwrapMessageContainer(msg) {
  let m = msg || {}
  for (let i = 0; i < 6; i++) {
    const next =
      m?.ephemeralMessage?.message ||
      m?.viewOnceMessage?.message ||
      m?.viewOnceMessageV2?.message ||
      m?.viewOnceMessageV2Extension?.message ||
      m?.documentWithCaptionMessage?.message ||
      null
    if (!next) break
    m = next
  }
  return m
}

function smsg(conn, m) {
  if (!m) return m

  const key = m.key
  if (key) {
    m.id = key.id
    m.chat = decodeJid(key.remoteJid)
    m.fromMe = key.fromMe
    m.isGroup = m.chat?.endsWith('@g.us')
    m.sender = decodeJid(
      m.fromMe ? conn.user?.id : key.participant || m.chat
    )
  }

  if (!m.message) return m

  const raw = unwrapMessageContainer(m.message)
  const mtype = getContentType(raw)

  m.mtype = mtype
  m.msg = raw[mtype]

  m.isText = mtype === 'conversation' || mtype === 'extendedTextMessage'
  m.isImage = mtype === 'imageMessage'
  m.isVideo = mtype === 'videoMessage'
  m.isSticker = mtype === 'stickerMessage'
  m.isAudio = mtype === 'audioMessage'
  m.isDocument = mtype === 'documentMessage'

  m.isMedia =
    m.isImage ||
    m.isVideo ||
    m.isDocument

  m.text =
    raw.conversation ||
    m.msg?.text ||
    m.msg?.caption ||
    raw?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    ''

  m.body = m.text

  m.hasCommandText =
    Boolean(m.text) &&
    !m.isSticker &&
    !m.isAudio

  m.mentionedJid =
    m.msg?.contextInfo?.mentionedJid || []

  const ctx = m.msg?.contextInfo
  if (ctx?.quotedMessage) {
    const qm = unwrapMessageContainer(ctx.quotedMessage)
    const qtype = getContentType(qm)
    const qcontent = qm[qtype]

    m.quoted = {
      key: {
        remoteJid: m.chat,
        fromMe: decodeJid(ctx.participant) === decodeJid(conn.user?.id),
        id: ctx.stanzaId,
        participant: decodeJid(ctx.participant)
      },
      message: qm,
      mtype: qtype,
      sender: decodeJid(ctx.participant),
      text:
        qcontent?.text ||
        qcontent?.caption ||
        ''
    }

    m.quoted.download = async () => {
      const stream = await downloadContentFromMessage(
        qcontent,
        qtype.replace('Message', '')
      )
      let buffer = Buffer.alloc(0)
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }
      return buffer
    }
  }

  m.reply = (text, chat = m.chat, options = {}) =>
    conn.sendMessage(chat, { text, ...options }, { quoted: m })

  m.download = () =>
    downloadContentFromMessage(
      m.msg,
      mtype.replace('Message', '')
    )

  return m
}

function makeWASocketConn(opts = {}) {
  const sock = makeWASocket(opts)

  sock.decodeJid = decodeJid
  sock.normalizeJid = decodeJid
  sock.smsg = m => smsg(sock, m)

  const INFO  = '\x1b[96m[INFO]\x1b[0m'
  const WARN  = '\x1b[93m[WARN]\x1b[0m'
  const ERROR = '\x1b[91m[ERROR]\x1b[0m'

  sock.logger = {
    info:  (...a) => console.log(INFO, ...a),
    warn:  (...a) => console.log(WARN, ...a),
    error: (...a) => console.log(ERROR, ...a)
  }

  return sock
}

export {
  makeWASocketConn as makeWASocket,
  smsg,
  delay,
  decodeJid
}
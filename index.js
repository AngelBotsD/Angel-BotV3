process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'
import './config.js'

import fs from 'fs'
import path, { join } from 'path'
import chalk from 'chalk'
import yargs from 'yargs'
import cfonts from 'cfonts'
import readline from 'readline'
import NodeCache from 'node-cache'
import pino from 'pino'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { Boom } from '@hapi/boom'
import {
  makeWASocket,
  jidNormalizedUser,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys'
import store from './lib/store.js'
import { protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import pkg from 'google-libphonenumber'

const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()

global.__filename = url => fileURLToPath(url)
global.__dirname = url => path.dirname(fileURLToPath(url))
global.__require = dir => createRequire(dir)

global.opts = yargs(process.argv.slice(2)).exitProcess(false).parse()
global.prefix = /^[#!./]/

protoType()
serialize()

console.log(chalk.magentaBright('\nAngel Bot iniciado'))
cfonts.say('Angel Bot', {
  font: 'block',
  align: 'center',
  gradient: ['cyan', 'white']
})

global.db = new Low(new JSONFile('database.json'))
await global.db.read()
global.db.data ||= { users: {}, chats: {}, settings: {}, stats: {} }

const __dirname__ = global.__dirname(import.meta.url)
const sessionsDir = join(__dirname__, 'sessions')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = q => new Promise(r => rl.question(q, r))

let opcion = null
const useQR = process.argv.includes('qr')
const useCode = process.argv.includes('code')

if (!fs.existsSync(join(sessionsDir, 'creds.json')) && !useQR && !useCode) {
  do {
    opcion = await question(
      chalk.cyan(
        '\nSeleccione una opción:\n1. Con código QR\n2. Con código de texto\n> '
      )
    )
  } while (!['1', '2'].includes(opcion))
}

const methodQR = useQR || opcion === '1'
const methodCode = useCode || opcion === '2'

const { state, saveCreds } = await useMultiFileAuthState(sessionsDir)

const msgRetryCounterCache = new NodeCache()
const userDevicesCache = new NodeCache()

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: methodQR,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
  },
  browser: Browsers.macOS('Desktop'),
  markOnlineOnConnect: false,
  syncFullHistory: false,
  generateHighQualityLinkPreview: false,
  msgRetryCounterCache,
  userDevicesCache,
  getMessage: async key => {
    const jid = jidNormalizedUser(key.remoteJid)
    const msg = await store.loadMessage(jid, key.id)
    return msg?.message || ''
  }
}

global.conn = makeWASocket(connectionOptions)

if (methodCode && !conn.authState.creds.registered) {
  let phoneNumber
  do {
    phoneNumber = await question(
      chalk.green('\nIngresa tu número de WhatsApp (ej: +521234567890): ')
    )
    phoneNumber = phoneNumber.replace(/\s+/g, '')
  } while (!isValidPhoneNumber(phoneNumber))

  rl.close()

  const number = phoneNumber.replace(/\D/g, '')
  setTimeout(async () => {
    const code = await conn.requestPairingCode(number)
    console.log(
      chalk.magenta('\nCódigo de vinculación:'),
      chalk.bold(code.match(/.{1,4}/g).join('-'))
    )
  }, 2000)
} else {
  rl.close()
}

let handler = await import('./handler.js')

async function reloadHandler(restart = false) {
  handler = await import(`./handler.js?update=${Date.now()}`)
  if (restart) {
    try { conn.ws.close() } catch {}
    global.conn = makeWASocket(connectionOptions)
  }
  conn.ev.removeAllListeners()
  conn.handler = handler.handler.bind(conn)
  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('creds.update', saveCreds)
  conn.ev.on('connection.update', connectionUpdate)
}

global.reloadHandler = reloadHandler

async function connectionUpdate(update) {
  const { connection, lastDisconnect } = update
  const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

  if (connection === 'open') {
    console.log(chalk.green('\nBot conectado correctamente'))
  }

  if (connection === 'close') {
    if (reason !== DisconnectReason.loggedOut) {
      console.log(chalk.yellow('Reconectando...'))
      await reloadHandler(true)
    } else {
      console.log(chalk.red('Sesión cerrada'))
    }
  }
}

const pluginDir = join(__dirname__, 'plugins')
global.plugins = {}

for (const file of fs.readdirSync(pluginDir)) {
  if (!file.endsWith('.js')) continue
  const module = await import(`./plugins/${file}`)
  global.plugins[file] = module.default || module
}

console.log('Plugins cargados:', Object.keys(global.plugins).length)

await reloadHandler()

process.on('uncaughtException', console.error)

function isValidPhoneNumber(number) {
  try {
    const parsed = phoneUtil.parseAndKeepRawInput(number)
    return phoneUtil.isValidNumber(parsed)
  } catch {
    return false
  }
}
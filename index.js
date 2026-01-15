import './config.js'

import fs from 'fs'
import path from 'path'
import os from 'os'
import readline from 'readline'
import chalk from 'chalk'
import lodash from 'lodash'
import yargs from 'yargs'
import cfonts from 'cfonts'
import syntaxerror from 'syntax-error'
import NodeCache from 'node-cache'
import pino from 'pino'

import { spawn } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'

import { makeWASocket } from './lib/simple.js'
import store from './lib/store.js'

import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()

const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  Browsers
} = await import('@whiskeysockets/baileys')

import {
  downloadContentFromMessage,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  generateWAMessageContent
} from '@whiskeysockets/baileys'

const __filename = (url = import.meta.url) =>
  /file:\/\//.test(url) ? fileURLToPath(url) : url

const __dirname = (url) => path.dirname(__filename(url))

global.__filename = __filename
global.__dirname = __dirname
global.__require = (url = import.meta.url) => createRequire(url)

global.timestamp = { start: new Date() }

global.opts = yargs(process.argv.slice(2)).exitProcess(false).parse()
global.prefix = '.'
global.prefixes = ['.', '!', '#', '/']

global.wa = {
  downloadContentFromMessage,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  generateWAMessageContent
}

if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')

cfonts.say('Angel Bot', {
  font: 'block',
  align: 'center',
  gradient: ['cyan', 'white']
})

cfonts.say('Optimized Core', {
  font: 'console',
  align: 'center',
  colors: ['magenta']
})

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(r => rl.question(q, r))

let opcion
const methodQR = process.argv.includes('qr')
const methodMobile = process.argv.includes('mobile')

if (methodQR) opcion = '1'

if (!methodQR && !fs.existsSync(`./${sessions}/creds.json`)) {
  do {
    opcion = await ask(
      chalk.white('Selecciona método:\n') +
      chalk.cyan('1. Código QR\n') +
      chalk.magenta('2. Código de 8 dígitos\n> ')
    )
  } while (!/^[12]$/.test(opcion))
}

const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
const { version } = await fetchLatestBaileysVersion()

const msgRetryCache = new NodeCache({ stdTTL: 0 })
const deviceCache = new NodeCache({ stdTTL: 0 })

const socketConfig = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: opcion === '1',
  mobile: methodMobile,
  browser: Browsers.macOS('Desktop'),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      pino({ level: 'fatal' })
    )
  },
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  msgRetryCounterCache: msgRetryCache,
  userDevicesCache: deviceCache,
  version,
  keepAliveIntervalMs: 55000
}

global.conn = makeWASocket(socketConfig)

conn.isInit = false

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update

  if (isNewLogin) conn.isInit = true

  if (connection === 'open') {
    const jid = jidNormalizedUser(conn.user.id)
    console.log(chalk.greenBright(`✔ Conectado como ${conn.user.name || jid}`))
  }

  if (connection === 'close') {
    const reason = lastDisconnect?.error?.output?.statusCode
    if (reason !== DisconnectReason.loggedOut) {
      await reloadHandler(true)
    }
  }
}

let handler = await import('./handler.js')
let isInit = true

global.reloadHandler = async (restart) => {
  const newHandler = await import(`./handler.js?update=${Date.now()}`)
  handler = newHandler

  if (restart) {
    try { conn.ws.close() } catch {}
    global.conn = makeWASocket(socketConfig)
    isInit = true
  }

  if (!isInit) {
    conn.ev.removeAllListeners()
  }

  conn.handler = handler.handler.bind(conn)
  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('connection.update', connectionUpdate)
  conn.ev.on('creds.update', saveCreds)

  isInit = false
}

await reloadHandler()

const pluginRoot = path.join(__dirname(import.meta.url), 'plugins')
global.plugins = {}

const loadPlugins = async () => {
  const files = fs.readdirSync(pluginRoot).filter(f => f.endsWith('.js'))
  for (const file of files) {
    const full = path.join(pluginRoot, file)
    try {
      const plugin = await import(`${full}?update=${Date.now()}`)
      global.plugins[file] = plugin.default || plugin
    } catch {}
  }
}

await loadPlugins()

fs.watch(pluginRoot, async (_, file) => {
  if (!file.endsWith('.js')) return
  const full = path.join(pluginRoot, file)
  if (!fs.existsSync(full)) {
    delete global.plugins[file]
    return
  }
  const err = syntaxerror(fs.readFileSync(full), file)
  if (err) return
  const plugin = await import(`${full}?update=${Date.now()}`)
  global.plugins[file] = plugin.default || plugin
})

setInterval(() => {
  fs.readdirSync('./tmp').forEach(f => fs.unlinkSync(`./tmp/${f}`))
}, 1000 * 60 * 4)

async function isValidPhoneNumber(num) {
  try {
    num = num.replace(/\s+/g, '')
    if (num.startsWith('+521')) num = num.replace('+521', '+52')
    const parsed = phoneUtil.parseAndKeepRawInput(num)
    return phoneUtil.isValidNumber(parsed)
  } catch {
    return false
  }
}
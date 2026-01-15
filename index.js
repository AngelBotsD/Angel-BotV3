import './config.js'

import fs, {
  readdirSync,
  statSync,
  unlinkSync,
  existsSync,
  mkdirSync,
  readFileSync,
  watch
} from 'fs'

import path, { join } from 'path'
import { platform } from 'process'
import { spawn } from 'child_process'
import { tmpdir } from 'os'
import { format } from 'util'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'

import chalk from 'chalk'
import lodash from 'lodash'
import yargs from 'yargs'
import cfonts from 'cfonts'
import syntaxerror from 'syntax-error'
import readline from 'readline'
import NodeCache from 'node-cache'
import * as ws from 'ws'

import pino from 'pino'
import Pino from 'pino'

import { Boom } from '@hapi/boom'
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

global.wa = {
  downloadContentFromMessage,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  generateWAMessageContent
}

const { CONNECTING } = ws
const { say } = cfonts
const { chain } = lodash

console.log(chalk.magentaBright('\nInicializando Angel Bot...\n'))

say('ANGEL BOT', {
  font: 'block',
  align: 'center',
  gradient: ['cyan', 'white']
})

say('Ultra Clean Runtime', {
  font: 'console',
  align: 'center',
  colors: ['magenta', 'cyan']
})

if (!existsSync('./tmp')) mkdirSync('./tmp')

global.__filename = function (pathURL = import.meta.url, rm = platform !== 'win32') {
  return rm ? fileURLToPath(pathURL) : pathToFileURL(pathURL).toString()
}

global.__dirname = function (pathURL) {
  return path.dirname(global.__filename(pathURL))
}

global.__require = function (dir = import.meta.url) {
  return createRequire(dir)
}

global.timestamp = { start: Date.now() }
const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(
  yargs(process.argv.slice(2)).exitProcess(false).parse()
)

global.prefix = '.'
global.prefixes = ['.', '!', '#', '/']

const { state, saveCreds } = await useMultiFileAuthState(global.sessions)

const msgRetryCounterCache = new NodeCache({ stdTTL: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0 })

const { version } = await fetchLatestBaileysVersion()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = q => new Promise(r => rl.question(q, r))

let opcion = process.argv.includes('qr') ? '1' : null

if (!opcion && !existsSync(`./${sessions}/creds.json`)) {
  do {
    opcion = await question(
      chalk.bold.white('Selecciona método:\n') +
      chalk.cyan('1. QR\n') +
      chalk.magenta('2. Código\n> ')
    )
  } while (!['1', '2'].includes(opcion))
}

const redefineConsoleMethod = (method, filters) => {
  const original = console[method]
  console[method] = (...args) => {
    const text = args.join(' ')
    if (filters.some(f => text.includes(Buffer.from(f, 'base64').toString()))) return
    original.apply(console, args)
  }
}

const filterStrings = [
  'Q2xvc2luZyBzdGFsZSBvcGVu',
  'RmFpbGVkIHRvIGRlY3J5cHQ='
]

console.info = () => {}
console.debug = () => {}
;['log', 'warn', 'error'].forEach(m => redefineConsoleMethod(m, filterStrings))

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: opcion === '1',
  browser: Browsers.macOS('Desktop'),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      Pino({ level: 'fatal' })
    )
  },
  markOnlineOnConnect: false,
  syncFullHistory: false,
  getMessage: async key => {
    try {
      const jid = jidNormalizedUser(key.remoteJid)
      const msg = await store.loadMessage(jid, key.id)
      return msg?.message || ''
    } catch {
      return ''
    }
  },
  msgRetryCounterCache,
  userDevicesCache,
  version
}

global.conn = makeWASocket(connectionOptions)

let handler = await import('./handler.js')
let isInit = true

global.reloadHandler = async restart => {
  const newHandler = await import(`./handler.js?${Date.now()}`)
  handler = newHandler

  if (restart) {
    try { conn.ws.close() } catch {}
    conn.ev.removeAllListeners()
    global.conn = makeWASocket(connectionOptions)
    isInit = true
  }

  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  conn.handler = handler.handler.bind(global.conn)
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn)

  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)

  isInit = false
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect } = update
  global.stopped = connection

  if (connection === 'open') {
    console.log(chalk.green.bold('\nConectado correctamente\n'))
  }

  if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    if (reason !== DisconnectReason.loggedOut) {
      await global.reloadHandler(true)
    }
  }
}

const pluginRoot = join(__dirname, 'plugins')
global.plugins = {}

const loadPlugins = async () => {
  const files = readdirSync(pluginRoot, { recursive: true })
    .filter(f => f.endsWith('.js'))

  for (const file of files) {
    const full = join(pluginRoot, file)
    const mod = await import(`${full}?${Date.now()}`)
    global.plugins[file] = mod.default || mod
  }
}

await loadPlugins()
watch(pluginRoot, loadPlugins)
await global.reloadHandler()

setInterval(() => {
  if (!conn?.user) return
  readdirSync('./tmp').forEach(f => unlinkSync(join('./tmp', f)))
}, 1000 * 60 * 4)

setInterval(() => {
  if (!conn?.user) return
  readdirSync(`./${sessions}`)
    .filter(f => f.startsWith('pre-key-'))
    .forEach(f => unlinkSync(`./${sessions}/${f}`))
}, 1000 * 60 * 10)

async function isValidPhoneNumber(n) {
  try {
    const parsed = phoneUtil.parseAndKeepRawInput(n.replace(/\s+/g, ''))
    return phoneUtil.isValidNumber(parsed)
  } catch {
    return false
  }
}
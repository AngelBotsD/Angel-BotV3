process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import cluster from 'cluster'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, watch } from 'fs'
import cfonts from 'cfonts'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import pino from 'pino'
import path, { join } from 'path'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import store from './lib/store.js'
import pkg from 'google-libphonenumber'
import readline from 'readline'
import NodeCache from 'node-cache'
import { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } from '@whiskeysockets/baileys'

const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { chain } = lodash
const { CONNECTING } = ws

let { say } = cfonts
console.log(chalk.magentaBright('\nMejor Bot Do Momento Start...'))
say('Angel Bot', { font: 'block', align: 'center', gradient: ['grey', 'white'] })
say('Hecho Y Optimizado Por Angel.xyz', { font: 'console', align: 'center', colors: ['cyan', 'magenta', 'yellow'] })

protoType()
serialize()

if (!existsSync('./tmp')) mkdirSync('./tmp')

global.__filename = function (pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? fileURLToPath(pathURL) : pathToFileURL(pathURL).toString()
}
global.__dirname = function (pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}
global.__require = function (dir = import.meta.url) {
  return createRequire(dir)
}

const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#!./]')

global.db = new Low(new JSONFile('database.json'))
global.loadDatabase = async function () {
  if (global.db.READ) return
  global.db.READ = true
  await global.db.read().catch(() => null)
  global.db.READ = null
  global.db.data ||= { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} }
  global.db.chain = chain(global.db.data)
}
await global.loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
const msgRetryCounterCache = new NodeCache()
const userDevicesCache = new NodeCache()
const { version } = await fetchLatestBaileysVersion()

let phoneNumber = global.botNumber
const methodCodeQR = process.argv.includes('qr')
const methodCode = !!phoneNumber || process.argv.includes('code')
const MethodMobile = process.argv.includes('mobile')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = q => new Promise(r => rl.question(q, r))

let opcion
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${sessions}/creds.json`)) {
  do {
    opcion = await question('Seleccione una opción:\n1. Con código QR\n2. Con código de texto de 8 dígitos\n--> ')
  } while (!['1', '2'].includes(opcion))
}

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: opcion === '1' || methodCodeQR,
  mobile: MethodMobile,
  browser: Browsers.macOS('Desktop'),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
  },
  msgRetryCounterCache,
  userDevicesCache,
  version
}

global.conn = makeWASocket(connectionOptions)

if (opcion === '2' && !conn.authState.creds.registered) {
  do {
    phoneNumber = await question('Ingrese su número de WhatsApp: ')
    phoneNumber = phoneNumber.replace(/[^\d+]/g, '')
    if (!phoneNumber.startsWith('+')) phoneNumber = `+${phoneNumber}`
  } while (!isValidPhoneNumber(phoneNumber))

  rl.close()
  const code = await conn.requestPairingCode(phoneNumber.replace(/\D/g, ''))
  console.log(`Código de Vinculación: ${code.match(/.{1,4}/g).join('-')}`)
}

async function isValidPhoneNumber(number) {
  try {
    number = number.replace(/\s+/g, '')
    if (number.startsWith('+521')) number = number.replace('+521', '+52')
    const parsed = phoneUtil.parse(number)
    return phoneUtil.isValidNumber(parsed)
  } catch {
    return false
  }
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect } = update
  if (connection === 'open') console.log('Bot conectado')
  if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    if (reason !== DisconnectReason.loggedOut) await global.reloadHandler(true)
  }
}

let handler = await import('./handler.js')
global.reloadHandler = async function (restart) {
  handler = await import(`./handler.js?${Date.now()}`)
  if (restart) {
    try { conn.ws.close() } catch {}
    global.conn = makeWASocket(connectionOptions)
  }
  conn.ev.on('messages.upsert', handler.handler.bind(global.conn))
  conn.ev.on('connection.update', connectionUpdate)
  conn.ev.on('creds.update', saveCreds)
}

const pluginRoot = join(__dirname, 'plugins')
global.plugins = {}

if (process.env.NODE_ENV !== 'production') {
  watch(pluginRoot, async (_, file) => {
    if (!file.endsWith('.js')) return
    const module = await import(`${join(pluginRoot, file)}?${Date.now()}`)
    global.plugins[file] = module.default || module
  })
}

await global.reloadHandler()
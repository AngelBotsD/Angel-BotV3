process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

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
import chalk from 'chalk'
import cfonts from 'cfonts'
import yargs from 'yargs'
import lodash from 'lodash'
import syntaxerror from 'syntax-error'
import { tmpdir } from 'os'
import { format } from 'util'
import readline from 'readline'
import NodeCache from 'node-cache'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

import {
  makeWASocket,
  protoType,
  serialize,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  Browsers,
  DisconnectReason
} from '@whiskeysockets/baileys'

import { Low, JSONFile } from 'lowdb'
import store from './lib/store.js'

const { chain } = lodash

/* ========= BANNER ========= */
console.log(chalk.magentaBright('\nIniciando Angel Bot...'))
cfonts.say('Angel Bot', {
  font: 'block',
  align: 'center',
  gradient: ['grey', 'white']
})

protoType()
serialize()

/* ========= TMP ========= */
if (!existsSync('./tmp')) mkdirSync('./tmp')

/* ========= GLOBAL HELPERS ========= */
global.__filename = (pathURL = import.meta.url) => fileURLToPath(pathURL)
global.__dirname = (pathURL = import.meta.url) =>
  path.dirname(global.__filename(pathURL))
global.__require = (dir = import.meta.url) => createRequire(dir)

/* ========= OPCIONES ========= */
global.opts = new Object(
  yargs(process.argv.slice(2)).exitProcess(false).parse()
)
global.prefix = /^[#!./]/

/* ========= DATABASE ========= */
global.db = new Low(new JSONFile('database.json'))

global.loadDatabase = async () => {
  if (global.db.data) return
  await global.db.read()
  global.db.data ||= {
    users: {},
    chats: {},
    settings: {},
    stats: {},
    msgs: {}
  }
  global.db.chain = chain(global.db.data)
}
await global.loadDatabase()

/* ========= AUTH ========= */
const sessions = 'sessions'
const { state, saveCreds } = await useMultiFileAuthState(sessions)
const { version } = await fetchLatestBaileysVersion()

const msgRetryCounterCache = new NodeCache()

/* ========= CONNECTION ========= */
global.conn = makeWASocket({
  logger: pino({ level: 'silent' }),
  printQRInTerminal: true,
  browser: Browsers.macOS('Desktop'),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      pino({ level: 'fatal' })
    )
  },
  msgRetryCounterCache,
  version,
  generateHighQualityLinkPreview: true,
  markOnlineOnConnect: false
})
/* ========= HANDLER ========= */
let handler = await import('./handler.js')

global.reloadHandler = async () => {
  try {
    const newHandler = await import(
      `./handler.js?update=${Date.now()}`
    )
    handler = newHandler
    conn.ev.off('messages.upsert', conn.handler)
    conn.handler = handler.handler.bind(conn)
    conn.ev.on('messages.upsert', conn.handler)
    console.log(chalk.yellow('♻ Handler recargado'))
  } catch (e) {
    console.error(e)
  }
}

conn.handler = handler.handler.bind(conn)
conn.ev.on('messages.upsert', conn.handler)
conn.ev.on('creds.update', saveCreds)

/* ========= CONNECTION UPDATE ========= */
conn.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect } = update

  if (connection === 'open') {
    const name = conn.user?.name || 'Desconocido'
    console.log(
      chalk.greenBright(`✅ Conectado como ${name}`)
    )
  }

  if (connection === 'close') {
    const reason = new Boom(
      lastDisconnect?.error
    )?.output?.statusCode

    if (reason !== DisconnectReason.loggedOut) {
      console.log(
        chalk.yellow('♻ Reconectando...')
      )
      await global.reloadHandler()
    } else {
      console.log(
        chalk.red('❌ Sesión cerrada')
      )
    }
  }
})

/* ========= PLUGINS ========= */
const pluginRoot = join(global.__dirname(), 'plugins')
global.plugins = {}

async function loadPlugins() {
  for (const file of readdirSync(pluginRoot)) {
    if (!file.endsWith('.js')) continue
    try {
      const full = join(pluginRoot, file)
      const module = await import(
        `${full}?update=${Date.now()}`
      )
      global.plugins[file] =
        module.default || module
    } catch (e) {
      console.error(
        'Error cargando plugin:',
        file,
        e
      )
    }
  }
}

await loadPlugins()

watch(pluginRoot, async (_, file) => {
  if (!file || !file.endsWith('.js')) return
  try {
    const full = join(pluginRoot, file)

    const err = syntaxerror(
      readFileSync(full),
      file,
      {
        sourceType: 'module',
        allowAwaitOutsideFunction: true
      }
    )
    if (err) {
      console.error(err)
      return
    }

    const module = await import(
      `${full}?update=${Date.now()}`
    )
    global.plugins[file] =
      module.default || module

    console.log(
      chalk.cyan(`🔄 Plugin recargado: ${file}`)
    )
  } catch (e) {
    console.error(e)
  }
})

/* ========= LIMPIEZA TMP ========= */
setInterval(() => {
  try {
    const files = readdirSync('./tmp')
    for (const file of files) {
      unlinkSync(join('./tmp', file))
    }
    console.log(
      chalk.gray('🧹 TMP limpiado')
    )
  } catch {}
}, 1000 * 60 * 5)

/* ========= READY ========= */
console.log(
  chalk.cyanBright('🚀 Angel Bot listo y estable')
)
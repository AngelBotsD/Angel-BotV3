import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'

const urlRegex = (await import('url-regex-safe')).default({ strict: false })

const nameCache = new Map()
const phoneCache = new Map()

function getPhone(jid) {
    if (phoneCache.has(jid)) return phoneCache.get(jid)
    const num = PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    phoneCache.set(jid, num)
    return num
}

async function getNameCached(conn, jid) {
    if (nameCache.has(jid)) return nameCache.get(jid)
    const name = await conn.getName(jid)
    nameCache.set(jid, name)
    return name
}

export default async function (m, conn = { user: {} }) {
    if (m.sender === conn.user?.jid) return

    const senderName = await getNameCached(conn, m.sender)
    const senderPhone = getPhone(m.sender)
    const sender = senderPhone + (senderName ? ' ~' + senderName : '')

    const chatName = m.chat ? await getNameCached(conn, m.chat) : ''
    const chatInfo = chatName ? (m.isGroup ? 'Grupo: ' + chatName : 'Chat privado: ' + chatName) : ''

    const user = global.db?.data?.users?.[m.sender] || {}

    const time = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })

    const size = m.msg?.fileLength?.low || m.msg?.fileLength || m.text?.length || 0
    const type = m.mtype ? m.mtype.replace(/message$/i, '').toUpperCase() : ''

    console.log(
        chalk.bgCyan.black(' BOT ') +
        ' ' + chalk.whiteBright(time) +
        '\n📍 ' + chalk.magentaBright(chatInfo) +
        '\n🙎 ' + chalk.yellow(sender) +
        '\n🎬 ' + chalk.green(type) +
        (size ? chalk.gray(` [${(size / 1024).toFixed(1)} KB]`) : '') +
        '\n⭐ ' + chalk.blue(`LV ${user.level || 0} | EXP ${user.exp || 0}`) +
        '\n'
    )

    if (typeof m.text === 'string' && m.text.length && m.text.length < 1500) {
        let log = m.text.replace(/\u200e+/g, '')
        log = log.replace(urlRegex, url => chalk.blueBright(url))
        if (m.mentionedJid) {
            for (const jid of m.mentionedJid) {
                const name = await getNameCached(conn, jid)
                log = log.replace('@' + jid.split('@')[0], chalk.blueBright('@' + name))
            }
        }
        console.log(m.isCommand ? chalk.yellow(log) : log)
    }

    if (/audio/i.test(m.mtype)) {
        const d = m.msg?.seconds || 0
        console.log(`🎧 AUDIO ${String(d / 60 | 0).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`)
    }

    if (/document/i.test(m.mtype)) {
        console.log(`📄 ${m.msg?.fileName || 'Documento'}`)
    }

    console.log()
}
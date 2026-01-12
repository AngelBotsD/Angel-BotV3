import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.owner = [
'159606034665538',
'205819731832938',
'5714222810',
'447894206349'
]

global.bot = {
name: '𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍',
alias: '𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍',
packname: '𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍',
author: '𝖠𝗇𝗀𝖾𝗅',
session: '𝖠𝗇𝗀𝖾𝗅𝖡𝗈𝗍',
banner: 'https://files.catbox.moe/4k94dp.jpg'
}

global.namebot = global.bot.name
global.botname = global.bot.alias
global.packname = global.bot.packname
global.author = global.bot.author
global.sessions = global.bot.session
global.banner = global.bot.banner

global.APIs = {
sky: 'https://api-sky.ultraplus.click',
may: 'https://sylphy.xyz'
}

global.APIKeys = {
sky: process.env.SKY_API_KEY || 'Angxlllll',
may: process.env.MAY_API_KEY || 'sylphy-zws90tK7OG_1768086161703_xc3t6vvmw'
}

const file = fileURLToPath(import.meta.url)

watchFile(file, () => {
unwatchFile(file)
console.log(chalk.redBright("config.js actualizado"))
import(`${file}?update=${Date.now()}`)
})
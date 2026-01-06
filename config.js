import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.owner = [
  '159606034665538',
  '5212213479743',
  '5215542690330',
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
  may: 'https://api.soymaycol.icu'
}

global.APIKeys = {
  sky: process.env.SKY_API_KEY || 'Angxlllll',
  may: process.env.MAY_API_KEY || 'may-e89378ce'
}

const file = fileURLToPath(import.meta.url)

watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("config.js actualizado"))
  import(`${file}?update=${Date.now()}`)
})
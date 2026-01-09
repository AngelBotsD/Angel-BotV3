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
  may: 'https://api.soymaycol.icu'
}

global.APIKeys = {
  may: process.env.MAY_API_KEY || 'may-e89378ce'
}
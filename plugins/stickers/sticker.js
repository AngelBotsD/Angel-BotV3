import crypto from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import webp from 'node-webpmux'
import fs from 'fs'
import path from 'path'

const tmp = './tmp'
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)

const random = ext => path.join(tmp, crypto.randomBytes(6).toString('hex') + '.' + ext)

async function toWebp(buffer, isVideo = false) {
  const input = random(isVideo ? 'mp4' : 'jpg')
  const output = random('webp')

  fs.writeFileSync(input, buffer)

  await new Promise((res, rej) => {
    ffmpeg(input)
      .on('end', res)
      .on('error', rej)
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-vf',
        'scale=320:320:force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0',
        '-loop', '0',
        '-preset', 'default',
        '-an',
        '-vsync', '0'
      ])
      .toFormat('webp')
      .save(output)
  })

  const buff = fs.readFileSync(output)
  fs.unlinkSync(input)
  fs.unlinkSync(output)
  return buff
}

async function addExif(buffer, packname) {
  const img = new webp.Image()
  await img.load(buffer)

  const json = {
    'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
    'sticker-pack-name': packname,
    'sticker-pack-publisher': '',
    emojis: ['']
  }

  const jsonBuf = Buffer.from(JSON.stringify(json))
  const exif = Buffer.concat([
    Buffer.from([
      0x49, 0x49, 0x2A, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00,
      0x00, 0x00
    ]),
    jsonBuf
  ])

  exif.writeUIntLE(jsonBuf.length, 14, 4)
  img.exif = exif

  return img.save(null, { lossless: true })
}

let handler = async (m, { conn }) => {
  try {
    let mime = m.mimetype || ''
    let isCaptionCmd = false

    if (m.message?.imageMessage?.caption || m.message?.videoMessage?.caption) {
      const cap = m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''
      isCaptionCmd = /^\.s\b/i.test(cap.trim())
    }

    let q = m.quoted ? m.quoted : m

    if (!isCaptionCmd && !m.quoted) return

    mime = q.mimetype || ''
    if (!/image|video/.test(mime)) {
      return conn.sendMessage(
        m.chat,
        { text: '⚠️ Responde a una imagen o video', ...global.rcanal },
        { quoted: m }
      )
    }

    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    const media = await q.download()
    const webpBuffer = await toWebp(media, /video/.test(mime))
    const sticker = await addExif(webpBuffer, m.pushName || 'Usuario')

    await conn.sendMessage(
      m.chat,
      { sticker, ...global.rcanal },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(
      m.chat,
      { text: '❌ Error al crear el sticker', ...global.rcanal },
      { quoted: m }
    )
  }
}

handler.help = ['s']
handler.tags = ['sticker']
handler.customPrefix = /^\.?(s|sticker)$/i;

export default handler
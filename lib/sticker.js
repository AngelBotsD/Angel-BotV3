import { dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { spawn } from 'child_process'
import webp from 'node-webpmux'
import fetch from 'node-fetch'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tmpDir = path.join(__dirname, '../tmp')

await fs.promises.mkdir(tmpDir, { recursive: true })

let running = 0
const MAX = 2
const queue = []

function run(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject })
    next()
  })
}

function next() {
  if (running >= MAX || !queue.length) return
  const { task, resolve, reject } = queue.shift()
  running++
  task().then(resolve).catch(reject).finally(() => {
    running--
    next()
  })
}

async function convertToWebp(buffer) {
  return run(() => new Promise(async (resolve, reject) => {
    const input = path.join(tmpDir, crypto.randomBytes(6).toString('hex'))
    const output = input + '.webp'

    await fs.promises.writeFile(input, buffer)

    const ff = spawn('ffmpeg', [
      '-y',
      '-i', input,
      '-vf',
      'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
      '-loop', '0',
      '-preset', 'fast',
      output
    ])

    ff.on('error', reject)

    ff.on('close', async code => {
      try {
        await fs.promises.unlink(input)
        if (code !== 0) throw code
        const data = await fs.promises.readFile(output)
        await fs.promises.unlink(output)
        resolve(data)
      } catch (e) {
        reject(e)
      }
    })
  }))
}

async function addExif(buffer, packname, author, categories = [''], extra = {}) {
  const img = new webp.Image()
  const id = crypto.randomBytes(16).toString('hex')

  const json = {
    'sticker-pack-id': id,
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    'emojis': categories,
    ...extra
  }

  const exifAttr = Buffer.from([
    0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,
    0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,
    0x00,0x00,0x16,0x00,0x00,0x00
  ])

  const jsonBuff = Buffer.from(JSON.stringify(json))
  const exif = Buffer.concat([exifAttr, jsonBuff])
  exif.writeUIntLE(jsonBuff.length, 14, 4)

  await img.load(buffer)
  img.exif = exif
  return img.save(null)
}

async function sticker(img, url, packname, author, categories, extra) {
  if (url) {
    const r = await fetch(url)
    img = await r.buffer()
  }

  const webpBuffer = await convertToWebp(img)
  try {
    return await addExif(webpBuffer, packname, author, categories, extra)
  } catch {
    return webpBuffer
  }
}

export {
  sticker
}
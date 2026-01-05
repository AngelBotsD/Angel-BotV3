import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import Crypto from 'crypto'
import webp from 'node-webpmux'
import { ffmpeg } from './ffmpeg.js'

function random(ext) {
  return join(tmpdir(), Crypto.randomBytes(6).readUIntLE(0, 6).toString(36) + '.' + ext)
}

async function imageToWebp(media) {
  const { data } = await ffmpeg(media, [
    '-vcodec', 'libwebp',
    '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0",
    '-preset', 'default'
  ], 'jpg', 'webp')

  return data
}

async function videoToWebp(media) {
  const { data } = await ffmpeg(media, [
    '-vcodec', 'libwebp',
    '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0",
    '-loop', '0',
    '-ss', '00:00:00',
    '-t', '00:00:06',
    '-preset', 'veryfast',
    '-an'
  ], 'mp4', 'webp')

  return data
}

async function writeExif(buffer, metadata) {
  if (!metadata.packname && !metadata.author) return buffer

  const img = new webp.Image()

  const json = {
    'sticker-pack-id': 'https://github.com/BOTCAHX/RTXZY-MD',
    'sticker-pack-name': metadata.packname,
    'sticker-pack-publisher': metadata.author,
    'emojis': metadata.categories || ['']
  }

  const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuff])

  exif.writeUIntLE(jsonBuff.length, 14, 4)

  const tmpIn = random('webp')
  const tmpOut = random('webp')

  await fs.writeFile(tmpIn, buffer)
  await img.load(tmpIn)
  img.exif = exif
  await img.save(tmpOut)

  const out = await fs.readFile(tmpOut)

  await Promise.allSettled([
    fs.unlink(tmpIn),
    fs.unlink(tmpOut)
  ])

  return out
}

async function writeExifImg(media, metadata) {
  const webp = await imageToWebp(media)
  return writeExif(webp, metadata)
}

async function writeExifVid(media, metadata) {
  const webp = await videoToWebp(media)
  return writeExif(webp, metadata)
}

export { imageToWebp, videoToWebp, writeExifImg, writeExifVid }
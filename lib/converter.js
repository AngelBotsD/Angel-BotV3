import { promises as fs } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'

const TMP_DIR = join(process.cwd(), 'tmp')
const MAX_FFMPEG = 2

await fs.mkdir(TMP_DIR, { recursive: true })

let active = 0
const queue = []

function run(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject })
    next()
  })
}

function next() {
  if (active >= MAX_FFMPEG) return
  if (!queue.length) return

  active++

  const { task, resolve, reject } = queue.shift()

  task()
    .then(resolve)
    .catch(reject)
    .finally(() => {
      active--
      next()
    })
}

async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return run(async () => {
    const id = Date.now() + '-' + Math.random().toString(36).slice(2)
    const input = join(TMP_DIR, id + '.' + ext)
    const output = input + '.' + ext2

    await fs.writeFile(input, buffer)

    await new Promise((resolve, reject) => {
      spawn('ffmpeg', [
        '-y',
        '-loglevel', 'error',
        '-i', input,
        ...args,
        output
      ])
        .on('error', reject)
        .on('close', code => code === 0 ? resolve() : reject(code))
    })

    const data = await fs.readFile(output)

    await Promise.allSettled([
      fs.unlink(input),
      fs.unlink(output)
    ])

    return { data }
  })
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '96k',
    '-vbr', 'on'
  ], ext, 'ogg')
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '96k',
    '-vbr', 'on'
  ], ext, 'opus')
}

function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '30',
    '-c:a', 'aac'
  ], ext, 'mp4')
}

export { ffmpeg, toPTT, toAudio, toVideo }
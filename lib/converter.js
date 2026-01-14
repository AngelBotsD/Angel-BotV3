import { spawn } from 'child_process'

function toPTTStream(buffer) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-vn',
      '-c:a', 'libopus',
      '-b:a', '64k',
      '-vbr', 'on',
      '-f', 'ogg',
      'pipe:1'
    ])

    const chunks = []
    ff.stdout.on('data', c => chunks.push(c))
    ff.stderr.on('data', () => {})
    ff.on('close', c =>
      c === 0
        ? resolve(Buffer.concat(chunks))
        : reject(new Error('FFmpeg audio error'))
    )

    ff.stdin.end(buffer)
  })
}

function toVideoStream(buffer) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-map', '0:v:0',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '30',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-f', 'mp4',
      'pipe:1'
    ])

    const chunks = []
    ff.stdout.on('data', c => chunks.push(c))
    ff.stderr.on('data', () => {})
    ff.on('close', c =>
      c === 0
        ? resolve(Buffer.concat(chunks))
        : reject(new Error('FFmpeg video error'))
    )

    ff.stdin.end(buffer)
  })
}

export {
  toPTTStream,
  toVideoStream
}
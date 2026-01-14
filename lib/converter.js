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
    ff.on('close', code =>
      code === 0
        ? resolve(Buffer.concat(chunks))
        : reject(new Error('FFmpeg error'))
    )

    ff.stdin.write(buffer)
    ff.stdin.end()
  })
}
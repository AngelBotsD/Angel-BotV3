let buffer = []
let limit = 200
let hooked = false

let originalStdout = null
let originalStderr = null

function capture(chunk, encoding) {
  try {
    const data = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(String(chunk), encoding || 'utf8')

    buffer.push(data)
    if (buffer.length > limit) buffer.shift()
  } catch {}
}

function hookStream(stream, storeOriginal) {
  const original = stream.write.bind(stream)
  storeOriginal(original)

  stream.write = (chunk, encoding, callback) => {
    capture(chunk, encoding)
    return original(chunk, encoding, callback)
  }
}

export default function hookStdout(maxLength = 200) {
  if (hooked) return api

  limit = maxLength
  buffer = []

  hookStream(process.stdout, fn => (originalStdout = fn))
  hookStream(process.stderr, fn => (originalStderr = fn))

  hooked = true
  api.isModified = true
  return api
}

export function disable() {
  if (!hooked) return

  if (originalStdout) process.stdout.write = originalStdout
  if (originalStderr) process.stderr.write = originalStderr

  hooked = false
  api.isModified = false
}

export function logs() {
  return buffer.length
    ? Buffer.concat(buffer)
    : Buffer.alloc(0)
}

const api = { disable, logs, isModified: false }
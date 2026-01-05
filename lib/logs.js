let buffer = []
let limit = 200
let hooked = false
let originalWrite = null

export default function hookStdout(maxLength = 200) {
  if (hooked) return api

  limit = maxLength
  buffer = []
  originalWrite = process.stdout.write.bind(process.stdout)

  process.stdout.write = (chunk, encoding, callback) => {
    const data = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk, encoding)

    if (buffer.length >= limit) buffer.shift()
    buffer.push(data)

    return originalWrite(chunk, encoding, callback)
  }

  hooked = true
  api.isModified = true
  return api
}

export function disable() {
  if (!hooked) return
  process.stdout.write = originalWrite
  hooked = false
  api.isModified = false
}

export function logs() {
  return buffer.length ? Buffer.concat(buffer) : Buffer.alloc(0)
}

const api = { disable, logs, isModified: false }
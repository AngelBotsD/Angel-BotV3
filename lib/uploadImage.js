import fetch from 'node-fetch'
import { FormData, Blob } from 'formdata-node'
import { fileTypeFromBuffer } from 'file-type'

export default async function uploadTelegraph(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Input inválido')
  }

  const type = await fileTypeFromBuffer(buffer)
  const ext = type?.ext || 'bin'
  const mime = type?.mime || 'application/octet-stream'

  const form = new FormData()
  const blob = new Blob([buffer], { type: mime })

  form.append('file', blob, `file.${ext}`)

  const res = await fetch('https://telegra.ph/upload', {
    method: 'POST',
    body: form,
    timeout: 30000
  })

  const json = await res.json().catch(() => null)

  if (!Array.isArray(json) || json[0]?.error) {
    throw new Error('Telegraph upload failed')
  }

  return 'https://telegra.ph' + json[0].src
}
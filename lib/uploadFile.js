import fetch from 'node-fetch'
import { FormData, Blob } from 'formdata-node'
import { fileTypeFromBuffer } from 'file-type'

const isBuffer = b => Buffer.isBuffer(b)

const fileIO = async buffer => {
  if (!isBuffer(buffer)) throw new Error('Input inválido')

  const { ext = 'bin', mime = 'application/octet-stream' } =
    await fileTypeFromBuffer(buffer) || {}

  const form = new FormData()
  const blob = new Blob([buffer], { type: mime })

  form.append('file', blob, `file.${ext}`)

  const res = await fetch('https://file.io/?expires=1d', {
    method: 'POST',
    body: form,
    timeout: 30000
  })

  const json = await res.json().catch(() => null)

  if (!json?.success || !json?.link) {
    throw new Error('file.io upload failed')
  }

  return json.link
}

const RESTfulAPI = async input => {
  const buffers = Array.isArray(input) ? input : [input]

  if (!buffers.every(isBuffer)) {
    throw new Error('Input inválido')
  }

  const form = new FormData()

  for (const buffer of buffers) {
    form.append('file', new Blob([buffer]))
  }

  const res = await fetch('https://storage.restfulapi.my.id/upload', {
    method: 'POST',
    body: form,
    timeout: 30000
  })

  const text = await res.text()
  let json

  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('RESTfulAPI respuesta inválida')
  }

  if (!json?.files?.length) {
    throw new Error('RESTfulAPI upload failed')
  }

  if (!Array.isArray(input)) return json.files[0].url
  return json.files.map(f => f.url)
}

export default async function uploadFile(input) {
  let lastError

  for (const uploader of [RESTfulAPI, fileIO]) {
    try {
      return await uploader(input)
    } catch (e) {
      lastError = e
    }
  }

  throw lastError || new Error('No se pudo subir el archivo')
}
import fetch from 'node-fetch'
import { FormData, Blob } from 'formdata-node'
import { JSDOM } from 'jsdom'

async function ezgifConvert({ endpoint, source, selector }) {
  const isUrl = typeof source === 'string' && /^https?:\/\//.test(source)
  const isBuffer = Buffer.isBuffer(source)

  if (!isUrl && !isBuffer) {
    throw new Error('Source inválido')
  }

  const form = new FormData()

  if (isUrl) {
    form.append('new-image-url', source)
  } else {
    const blob = new Blob([source], { type: 'image/webp' })
    form.append('new-image', blob, 'image.webp')
  }

  const res = await fetch(`https://ezgif.com/${endpoint}`, {
    method: 'POST',
    body: form,
    timeout: 30000
  })

  const html = await res.text()
  const { document } = new JSDOM(html).window

  const formEl = document.querySelector('form[action]')
  if (!formEl) {
    throw new Error('Ezgif form not found')
  }

  const form2 = new FormData()
  let fileId = null

  for (const input of formEl.querySelectorAll('input[name]')) {
    form2.append(input.name, input.value)
    if (input.name === 'file') fileId = input.value
  }

  if (!fileId) {
    throw new Error('Ezgif file id not found')
  }

  const res2 = await fetch(`https://ezgif.com/${endpoint}/${fileId}`, {
    method: 'POST',
    body: form2,
    timeout: 30000
  })

  const html2 = await res2.text()
  const { document: document2 } = new JSDOM(html2).window

  const result = document2.querySelector(selector)
  if (!result) {
    throw new Error('Resultado no encontrado')
  }

  return new URL(result.src, res2.url).toString()
}

async function webp2mp4(source) {
  return ezgifConvert({
    endpoint: 'webp-to-mp4',
    source,
    selector: 'div#output video source'
  })
}

async function webp2png(source) {
  return ezgifConvert({
    endpoint: 'webp-to-png',
    source,
    selector: 'div#output img'
  })
}

export { webp2mp4, webp2png }
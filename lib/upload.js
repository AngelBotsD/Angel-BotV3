import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'

export default async function quAx(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return {
        status: false,
        message: 'Archivo no encontrado'
      }
    }

    const stream = fs.createReadStream(filePath)
    const form = new FormData()

    form.append('files[]', stream, path.basename(filePath))

    const { data } = await axios.post(
      'https://qu.ax/upload.php',
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000
      }
    )

    if (!data?.files?.length) {
      return {
        status: false,
        message: 'Respuesta inválida del servidor'
      }
    }

    const file = data.files[0]

    return {
      status: true,
      creator: 'Angxll',
      result: {
        hash: file.hash ?? '',
        name: file.name ?? '',
        url: file.url ?? '',
        size: file.size ?? '',
        expiry: file.expiry ?? ''
      }
    }
  } catch (err) {
    return {
      status: false,
      message: err?.message || 'Error desconocido'
    }
  }
}
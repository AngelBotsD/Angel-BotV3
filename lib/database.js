import { resolve, dirname } from 'path'
import { promises as fs } from 'fs'

class Database {
  constructor(filepath, options = {}, ...jsonArgs) {
    this.file = resolve(filepath)
    this.logger = options.logger || console
    this._jsonargs = jsonArgs
    this._data = {}
    this._saving = false
    this._pending = false
    this._timer = null
    this._delay = options.delay ?? 2000
    this._loaded = false
  }

  async init() {
    if (this._loaded) return this._data
    await this._load()
    this._loaded = true
    return this._data
  }

  get data() {
    return this._data
  }

  set data(value) {
    this._data = value
    this.save()
  }

  save() {
    if (this._timer) clearTimeout(this._timer)
    this._timer = setTimeout(() => this._flush(), this._delay)
  }

  async _load() {
    try {
      const data = await fs.readFile(this.file, 'utf8')
      this._data = JSON.parse(data)
    } catch (e) {
      if (e.code !== 'ENOENT') {
        this.logger.warn('[DB] Error al cargar DB:', e.message)
      }
      this._data = {}
    }
    return this._data
  }

  async _flush() {
    if (this._saving) {
      this._pending = true
      return
    }

    this._saving = true

    try {
      await fs.mkdir(dirname(this.file), { recursive: true })
      await fs.writeFile(
        this.file,
        JSON.stringify(this._data, ...this._jsonargs)
      )
    } catch (e) {
      this.logger.error('[DB] Error al guardar DB:', e)
    }

    this._saving = false

    if (this._pending) {
      this._pending = false
      this.save()
    }
  }
}

export default Database
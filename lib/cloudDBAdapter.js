import got from 'got'

const stringify = obj => JSON.stringify(obj)
const parse = str => JSON.parse(str, (_, v) => {
  if (
    v &&
    typeof v === 'object' &&
    v.type === 'Buffer' &&
    Array.isArray(v.data)
  ) {
    return Buffer.from(v.data)
  }
  return v
})

class CloudDBAdapter {
  constructor(url, {
    serialize = stringify,
    deserialize = parse,
    fetchOptions = {},
    cacheTime = 30_000,
    timeout = 10_000,
    logger = console
  } = {}) {
    this.url = url
    this.serialize = serialize
    this.deserialize = deserialize
    this.fetchOptions = fetchOptions
    this.cacheTime = cacheTime
    this.timeout = timeout
    this.logger = logger

    this._cache = null
    this._lastRead = 0
    this._writing = false
  }

  async read(force = false) {
    if (!force && this._cache && Date.now() - this._lastRead < this.cacheTime) {
      return this._cache
    }

    try {
      const res = await got(this.url, {
        method: 'GET',
        responseType: 'text',
        timeout: { request: this.timeout },
        headers: { 'Accept': 'application/json' },
        ...this.fetchOptions
      })

      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error(`HTTP ${res.statusCode}`)
      }

      const data = this.deserialize(res.body)
      this._cache = data
      this._lastRead = Date.now()
      return data
    } catch (e) {
      this.logger.warn('[CloudDB] read error:', e.message)
      return this._cache
    }
  }

  async write(obj) {
    if (this._writing) return false
    this._writing = true

    this._cache = obj
    this._lastRead = Date.now()

    try {
      const res = await got(this.url, {
        method: 'POST',
        timeout: { request: this.timeout },
        headers: { 'Content-Type': 'application/json' },
        body: this.serialize(obj),
        ...this.fetchOptions
      })

      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error(`HTTP ${res.statusCode}`)
      }

      return res.body
    } catch (e) {
      this.logger.error('[CloudDB] write error:', e.message)
      throw e
    } finally {
      this._writing = false
    }
  }
}

export default CloudDBAdapter
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
    cacheTime = 30_000
  } = {}) {
    this.url = url
    this.serialize = serialize
    this.deserialize = deserialize
    this.fetchOptions = fetchOptions
    this.cacheTime = cacheTime

    this._cache = null
    this._lastRead = 0
  }

  async read(force = false) {
    if (!force && this._cache && Date.now() - this._lastRead < this.cacheTime) {
      return this._cache
    }

    try {
      const res = await got(this.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        decompress: true,
        ...this.fetchOptions
      })

      if (res.statusCode !== 200) throw new Error(res.statusMessage)

      this._cache = this.deserialize(res.body)
      this._lastRead = Date.now()
      return this._cache
    } catch (e) {
      return this._cache
    }
  }

  async write(obj) {
    this._cache = obj
    this._lastRead = Date.now()

    const res = await got(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      decompress: true,
      ...this.fetchOptions,
      body: this.serialize(obj)
    })

    if (res.statusCode !== 200) throw new Error(res.statusMessage)
    return res.body
  }
}

export default CloudDBAdapter
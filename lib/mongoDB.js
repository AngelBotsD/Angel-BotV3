import mongoose from 'mongoose'

const { Schema, connect, model } = mongoose
const defaultOptions = { useNewUrlParser: true, useUnifiedTopology: true }

const DataSchema = new Schema({
  data: {
    type: Object,
    default: {}
  }
}, { minimize: false })

export default class MongoDB {
  constructor(url, options = defaultOptions, delay = 1000) {
    this.url = url
    this.options = options
    this.delay = delay
    this.data = {}
    this._timer = null
    this._writing = false
    this._ready = false

    this.db = connect(this.url, this.options)
      .then(() => {
        this.Model = model('bot_data', DataSchema)
        this._ready = true
      })
      .catch(console.error)
  }

  async read() {
    await this.db
    let doc = await this.Model.findOne({})
    if (!doc) {
      doc = await this.Model.create({ data: {} })
    }
    this.data = doc.data || {}
    return this.data
  }

  write(newData) {
    if (!newData || !this._ready) return
    this.data = newData
    clearTimeout(this._timer)
    this._timer = setTimeout(() => this._commit(), this.delay)
  }

  async _commit() {
    if (this._writing) return
    this._writing = true
    try {
      await this.Model.updateOne(
        {},
        { $set: { data: this.data } },
        { upsert: true }
      )
    } catch (e) {
      console.error(e)
    }
    this._writing = false
  }
}
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) ? new Promise(r => setTimeout(r, ms)) : Promise.resolve()

const QUEUE_DELAY = 5000

export default class Queue {
    constructor() {
        this.queue = []
        this.running = false
    }

    add(item) {
        if (!this.queue.includes(item)) {
            this.queue.push(item)
        }
    }

    has(item) {
        return this.queue.includes(item)
    }

    delete(item) {
        const i = this.queue.indexOf(item)
        if (i !== -1) this.queue.splice(i, 1)
    }

    first() {
        return this.queue[0]
    }

    last() {
        return this.queue[this.queue.length - 1]
    }

    getIndex(item) {
        return this.queue.indexOf(item)
    }

    getSize() {
        return this.queue.length
    }

    isEmpty() {
        return this.queue.length === 0
    }

    async waitQueue(item) {
        if (!this.has(item)) throw new Error('item not found')

        while (this.first() !== item) {
            await delay(50)
        }

        if (this.running) return

        this.running = true
        await delay(QUEUE_DELAY)
        this.delete(item)
        this.running = false
    }
}

class Mutex {
  constructor (name) {
    this.name = name
    this.queue = []
    this.locked = false
  }

  lock () {
    if (this.locked) {
      return new Promise(resolve => this.queue.push(resolve))
    }
    this.locked = true
    return Promise.resolve(true)
  }

  isLocked () { return this.locked }

  unlock () {
    if (!this.locked) {
      throw new Error('Trying to unlock NOT locked Mutex')
    }
    if (this.queue.length) {
      this.queue.shift()(true)
    } else {
      this.locked = false
    }
  }
}

module.exports = Mutex

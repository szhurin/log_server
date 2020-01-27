const to = require('await-to-js').default

const pDefer = require('p-defer')

const actoinLog = require('../../_sys/log').child({ module: 'periodic.action' })

const UPDATE_INTERVAL = 60000

/**
 * Periodic - creates a lockable ( allowToProceed - method ) periodic caller to updaterFunc
 * 
 */
class Periodic {
  constructor(updaterFunc, updateInterval = UPDATE_INTERVAL, log = actoinLog) {
    this.updaterFunc = updaterFunc
    this.updateInterval = updateInterval
    this.log = log

    this.updater()
  }

  async allowToProceed() {
    const [, result] = await to(this.initDefer.promise)
    return result
  }

  async updater() {
    this.initDefer = pDefer();
    const [err, result] = await to(this.updaterFunc())

    if (err) {
      this.log.error(err, 'ERROR during update')
    }
    this.initDefer.resolve(result)

    setTimeout(() => this.updater(), this.updateInterval)
    return result
  }
}

module.exports = Periodic

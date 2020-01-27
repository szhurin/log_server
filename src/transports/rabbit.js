// NOT IMPLEMENTED YET

const to = require('await-to-js').default

const rabbit = require('../utils/rabbit')
const log = require('../_sys/log').child({ module: 'rabbit.transport' })

const { rabbit: { queueName } } = require('../_config')

let started = false

/**
 *
 * @param {*} processor
 * @param {*} statsCB - callback for stats collection
 *
 * @returns function ({{ name, src = '', desc = '', shortDesc = '', currency = '' }, uId})=>{...}
 */
const makeCB = (processor, statsCB) => async ({ event, uId }) => {
  // setup stats collection
  const stats = {
    method: 'rabbit',
    startTS: Date.now()
  }

  // process EVENT
  const [err, result] = await to(processor.addItem(event, uId))
  if (err) {
    log.error(err, { uId, event }, 'ERROR during processor.addItem')
  } else {
    log.trace({ uId, event, result }, { test: true }, 'TRACE processor.addItem')
  }

  // execute stats collection
  stats.dur = Date.now() - stats.startTS
  stats.failed = !!err
  if (typeof statsCB === 'function') {
    statsCB(stats)
  }
}

const start = async (processor, statsCB) => {
  if (started !== false) {
    return started
  }
  started = null

  const response = true
  await rabbit
    .listen(queueName, makeCB(processor, statsCB))
    .catch((err) => {
      log.error(err, 'An ERROR during transport server startup')
      throw err
    })
  started = true
  return response
}

const stop = async () => {
  if (!started) {
    return true
  }
  const [res, err] = await to(rabbit.close())
  if (!err) {
    started = false
    return res
  }
  return err
}

module.exports = {
  start,
  stop
}

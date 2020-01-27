const server = require('fastify')()

const log = require('./log').child({ module: 'status' })

const { api } = require('../_config')
const prometheus = require('./prometheus')

const port = api.statusPort || 1201
const host = api.statusHost || '0.0.0.0'
const MIN_STATUS_INTERVAL = 1000

let started = false

function start(statusProvider, logStatusInterval = 0) {
  if (started) {
    return true
  }
  started = true

  server.get('/status', async () => statusProvider.getStatusObj())

  prometheus.init(server, statusProvider)

  server.listen(port, host, (err, address) => {
    if (err) {
      log.error(err, 'An ERROR during status server startup'); // eslint-disable-line
      process.exit(1)
    }
    log.info('Local STATUS API is listening at %s', address); // eslint-disable-line
  })


  if (logStatusInterval > 0) {
    const interval = Math.max(logStatusInterval, MIN_STATUS_INTERVAL)
    log.info({ interval, minAllowedInterval: MIN_STATUS_INTERVAL }, 'STATUS log is set to interval')
    setInterval(() => {
      log.info(statusProvider.getStatusObj(), 'STATUS')
    }, interval)
  }
  return true
}

function stop() {
  if (!started) {
    return true
  }
  server.close()
  return true
}

module.exports = {
  start,
  stop
}

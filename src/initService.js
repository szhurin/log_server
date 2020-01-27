const to = require('await-to-js').default

const statusProvider = require('./utils/statusProvider')

const { clickhouseConfig } = require('./_config')
require('./utils/clickhouse').getInstance(clickhouseConfig) // init db

const log = require('./_sys/log').child({ module: 'INIT' })
const processor = require('./actions')

// const rabbit = require('./transports/rabbit')
const rest = require('./transports/rest')

const swagger = require('./utils/_swagger')

const start = async () => {
  log.info('starting service...')

  swagger.init(rest.server)

  const initResults = await Promise.all([
    Promise.resolve('rest'),
    to(rest.start(processor, statusProvider.getStatsCB('rest'))),
    // Promise.resolve('rabbit'),
    // to(rabbit.start(processor, statusProvider.getStatsCB('rabbit')))
  ]
  )

  const initArr = initResults
    .map((el, i, arr) => (Array.isArray(el) ? [arr[i - 1], ...el] : el))
    .filter(Array.isArray)

  const [err, res] = initArr.reduce((agg, [name, itemErr, itemRes]) => {
    if (itemErr) {
      agg[0] = `${agg[0] || ''}Failed to start ${name}; ` // eslint-disable-line no-param-reassign
    }
    agg[1].push(itemRes)
    return agg
  }, [null, []])

  if (err) {
    statusProvider.setStatus(err)
    throw new Error(err)
  }
  statusProvider.setStatus('Started')
  return res
}
const stop = () => {
  log.info('stopping service...')
  rest.stop()
  // rabbit.stop()
}

module.exports = {
  statusProvider,
  start,
  stop
}

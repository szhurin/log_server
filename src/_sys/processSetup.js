const to = require('await-to-js').default

const log = require('./log').child({ module: 'PROSESS.setup' })

const config = require('../_config')

let SHUTDOWN_TIMEOUT = 1000
let shuttingDown = false

async function shutdown (worker) {
  if (shuttingDown) {
    log.info('Already in the process of graceful shutdown.')
    return
  }

  log.info('Shutting down gracefully.')
  shuttingDown = true

  setTimeout(() => {
    log.error('Could not shutdown in time limit, using force now.')
    process.exit(1)
  }, SHUTDOWN_TIMEOUT).unref()

  if (worker && worker.stop()) {
    await worker.stop()
  }
}

let started = false

function processSetup (worker) {
  ['SIGINT', 'SIGTERM', 'SIGPIPE'].forEach((sigdie) => {
    process.on(sigdie, async () => {
      log.info(`Received ${sigdie}`)
      await shutdown(worker)
      process.exit(0)
    })
  })
  process.on('unhandledRejection', (error) => {
    log.warn(error, 'unhandledRejection')
  })
  process.on('uncaughtException', async (error) => {
    log.error(error, 'Got uncaughtException.')

    process.on('exit', () => {
      process.exit(1)
    })

    await shutdown(worker)
    process.exit(1)
  })
}

async function startup (worker, forceShutdownTimeMS = SHUTDOWN_TIMEOUT) {
  if (started) {
    return
  }
  started = true
  log.info({ config }, 'STARTING PROCESS .....')

  SHUTDOWN_TIMEOUT = forceShutdownTimeMS

  processSetup(worker)

  const [err] = await to(worker.start())
  if (err) {
    log.error(err, 'ERROR during service start...')
    await shutdown(worker)
    process.exit(1)
  }
  log.info({ config }, 'PROCESS STARTED !')
}

module.exports = {
  startup
}

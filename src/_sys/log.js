const { logs: { level } } = require('../_config')

const logger = require('pino')({ level })

module.exports = logger

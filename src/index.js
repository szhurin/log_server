const processSetup = require('./_sys/processSetup')
const statusSetup = require('./_sys/statusServerSetup')
const service = require('./initService')

const LOG_STATUS_INTERVAL = 600000

processSetup.startup(service)

statusSetup.start(service.statusProvider, LOG_STATUS_INTERVAL)

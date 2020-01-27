const configGlobal = require('../_config');

const getStatusStatsObj = () => ({ am: 0, durMs: 0, failedAm: 0, failedDurMs: 0 })

const statsProcessorBuilder = obj => ({ failed, dur }) => {
  if (failed) {
    obj.failedAm += 1 // eslint-disable-line no-param-reassign
    obj.failedDurMs += dur // eslint-disable-line no-param-reassign
  }
  obj.am += 1 // eslint-disable-line no-param-reassign
  obj.durMs += dur // eslint-disable-line no-param-reassign
}

const config = {...configGlobal}

config.clickhouseConfig  = {... configGlobal.clickhouseConfig}
config.clickhouseConfig.auth = 'xxxx:xxxxxx'

const statusObj = {
  status: 'OK',
  config,
  data: {}
}

const getStatsCB = (name) => {
  if (name === 'status') {
    throw new Error('Cannot create stats object with name "status" ')
  }
  if (!statusObj.data[name]) {
    statusObj.data[name] = getStatusStatsObj()
  }
  return statsProcessorBuilder(statusObj.data[name])
}

module.exports = {
  setStatus: (status) => { statusObj.status = status },
  getStatusObj: () => statusObj,
  getStatsCB
}

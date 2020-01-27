
const ClickHouse = require('@apla/clickhouse')
const log = require('../_sys/log').child({ module: 'util.clickhouse' })

const { clickhouseConfig } = require('../_config')

let instance

const getInstance = config => new ClickHouse(config)



/*
  Query result schema

  res = {
      meta: [
        { name: 'date', type: 'Date' },
        { name: 'type_id', type: 'UInt16' },
        { name: 'user_id', type: 'UInt32' },
        { name: 'created_at', type: 'DateTime' },
        { name: 'src', type: 'String' },
        { name: 'short_desc', type: 'String' },
        { name: 'currency', type: 'String' },
        { name: 'desc', type: 'String' }
      ],
      data: [ [ '2019-08-28', 1, 1, '2019-08-28 17:35:18', '', '', '', '' ] ],
      rows: 1,
      rows_before_limit_at_least: 8,
      statistics: { elapsed: 0.000656849, rows_read: 8, bytes_read: 384 },
      transferred: 637
    }
*/


module.exports = {
  getQueryValues: (chResult, valuesNeeded = []) => {
    // processing chResult object from clickhouse
    // description for chResult is located in ./tests/_utils/clickhouse.js 73
    const names = chResult.meta.map(({ name }) => name) // extracting names from meta array of objects
    // find indexes of interested fields
    const indexes = valuesNeeded.reduce((indexesObj, name) => {
      return { [name]: names.indexOf(name), ...indexesObj }
    }, {})

    // extracting interesting fields values from chResult.data 
    result = chResult.data.reduce((resultArr, itemArr) => {
      const valuesObj = valuesNeeded.reduce((values, name) => {
        return { ...values, [name]: itemArr[indexes[name]] }
      }, {})
      return [...resultArr, valuesObj]
    }, [])
    return result
  },

  getInstance: (config) => {
    if (!instance) {
      const instConf = config || clickhouseConfig
      instance = getInstance(instConf)
      instance.pinging()
        .then((response) => {
          log.info({ response, instConf }, 'clickhouse PING')
        })
        .catch((error) => {
          log.error({ error, instConf }, 'clickhouse PING ERROR')
        })
    }
    return instance
  }
}

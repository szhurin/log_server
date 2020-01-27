const to = require('await-to-js').default
const vsprintf = require('sprintf-js').vsprintf

const clickhouse = require('../../src/utils/clickhouse').getInstance()

const EVENT_NAME_TABLE = process.env.CLICKHOUSE_TYPES_TABLE_NAME
const EVENT_TABLE = process.env.CLICKHOUSE_EVENT_TABLE_NAME

const emptyEventNameObj = () => ({ name2id: {}, id2name: [] })

let events

let inited = false

/**
 * updates internal event names
 */
const updateNamesFromDB = async () => {
  if (inited) {
    return true
  }
  const [err, result] = await to(clickhouse.querying(`SELECT * FROM  ${EVENT_NAME_TABLE}`))
  if (err) {
    console.error(err, 'ERROR during event list retrieval') // eslint-disable-line no-console
    if (!inited) {
      // need to throw in separate thread so it would not be caught! TODO: make good shutdown
      setImmediate(() => { throw new Error('ERROR during first name update, perhaps DB is down') })
    }
    throw err
  }

  const names = result.meta.map(({ name }) => name)
  const nameIndex = names.indexOf('name')
  const idIndex = names.indexOf('id')

  events = result.data.reduce((resultObj, itemObj) => {
    const name = itemObj[nameIndex]
    const id = itemObj[idIndex]
    resultObj.name2id[name] = id // eslint-disable-line no-param-reassign
    resultObj.id2name[+id] = name // eslint-disable-line no-param-reassign
    return resultObj
  }, emptyEventNameObj())
  inited = true
  return true
}

/**
 *
 * @param {object} event - { name, src = '', desc = '', shortDesc = '', currency = '' }
 * @param {int} uId - user ID for event to assoc with
 */
const getLastItem = async (eventName = 'test', uId = 1) => {
  await updateNamesFromDB()
  const typeId = events && events.name2id && events.name2id[eventName]

  if (!typeId) {
    throw new Error('event does not exist')
  }

  const query = vsprintf(
    ['SELECT * FROM %(table)s ',
      'WHERE user_id=%(uId)s AND type_id=%(typeId)s ORDER BY created_at DESC LIMIT 1'].join(''),
    { table: EVENT_TABLE, typeId, uId })

  const [err, res] = await to(clickhouse.querying(query))

  if (err) {
    console.error(err, 'db select ERROR')
    throw new Error(err)
  }

  /*
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

  return res
}

const getType = async (name = 'test') => {
  const query = vsprintf(
    ['SELECT * FROM %(table)s ',
      "WHERE name='%(name)s'"].join(''),
    { table: EVENT_NAME_TABLE, name })

  const [err, res] = await to(clickhouse.querying(query))

  if (err) {
    console.error(err, 'db select ERROR')
    throw new Error(err)
  }

  return res
}
const delType = async (name = '') => {
  const query = vsprintf(
    ['alter table %(table)s ',
      "delete where name='%(name)s'"].join(''),
    { table: EVENT_NAME_TABLE, name })

  const [err, res] = await to(clickhouse.querying(query))

  if (err) {
    console.error(err, 'db delete ERROR')
    throw new Error(err)
  }

  return res
}

module.exports = {
  getLastItem,
  getType,
  delType
}

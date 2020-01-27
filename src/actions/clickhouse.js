const to = require('await-to-js').default
const moment = require('moment')
const vsprintf = require('sprintf-js').vsprintf

const clickhouseObj = require('../utils/clickhouse')
const clickhouse = clickhouseObj.getInstance()

const Mutex = require('./tools/Mutex')
const Periodic = require('./tools/PeriodicAction')
const log = require('../_sys/log').child({ module: 'writer.clickhouse' })
const { clickhouseConfig: { typeTable, logsTable, canAddType } } = require('../_config')

const EVENT_NAME_TABLE = typeTable
const EVENT_TABLE = logsTable

const emptyEventNameObj = () => ({ name2id: {}, id2name: [] })

let eventsCache // for caching 1-to-n relation in node.js process

const typeUpdateMutex = new Mutex('typeUpdate')

const UPDATE_INTERVAL = 60000

let inited = false

/**
 * updates internal event names
 */
const updateEventNamesFromDB = async () => {
  const [err, chResult] = await to(clickhouse.querying(`SELECT * FROM  ${EVENT_NAME_TABLE}`))
  if (err) {
    log.error(err, 'ERROR during event list retrieval')
    if (!inited) {
      // need to throw in separate thread so it would not be caught! TODO: make good shutdown
      setImmediate(() => { throw new Error('ERROR during first name update, perhaps DB is down') })
    }
    throw err
  }

  // processing chResult object from clickhouse

  const valuesArr = clickhouseObj.getQueryValues(chResult, ['name', 'id'])

  // extracting interesting fields values from query processor result 
  eventsCache = valuesArr.reduce((cacheObj, { name, id }) => {
    cacheObj.name2id[name] = id // eslint-disable-line no-param-reassign
    cacheObj.id2name[+id] = name // eslint-disable-line no-param-reassign
    return cacheObj
  }, emptyEventNameObj())
  inited = true
  return true
}

// creating a periodic caller to async 'updateEventNamesFromDB' with UPDATE_INTERVAL
const update = new Periodic(updateEventNamesFromDB, UPDATE_INTERVAL)

const getTypes = async (forceUpdate) => {
  if (forceUpdate) {
    await updateEventNamesFromDB()
  }
  return eventsCache.id2name.slice(1)
}

const unlockReturn = (returnValue) => {
  typeUpdateMutex.unlock()
  if (returnValue !== true) {
    throw new Error(returnValue)
  }
  return returnValue
}

const addType = async (name, desc = '') => {
  if (!canAddType) {
    throw new Error('cannot add type, use other node')
  }
  if (!name) {
    throw new Error('type name is empty')
  }
  log.trace({ name, desc }, 'ADDING TYPE')
  await typeUpdateMutex.lock()
  const [nameErr, nameResult] = await to(clickhouse.querying(`SELECT * FROM  ${EVENT_NAME_TABLE} where name='${name}'`))
  if (nameErr) {
    log.error(nameErr, 'ERROR during type_name selection')
    return unlockReturn('error, db not responds')
  }
  if (nameResult.rows !== 0) {
    return unlockReturn('error, such type already exists')
  }
  const [idErr, idResult] = await to(clickhouse.querying(`SELECT id FROM  ${EVENT_NAME_TABLE} order by id DESC limit 1`))
  if (idErr) {
    log.error(idErr, 'ERROR during type_id selection')
    return unlockReturn('error, db not responds')
  }

  const values = {
    table: EVENT_NAME_TABLE,
    id: parseInt((idResult.data[0] || 0)) + 1,
    name,
    desc
  }
  const query = vsprintf(
    'INSERT INTO alteration_types (id, name, "desc") VALUES ( %(id)s, \'%(name)s\', \'%(desc)s\')',
    values)

  log.trace({ query }, 'type query trace')
  const [err] = await to(clickhouse.querying(query))
  if (err) {
    log.error(err, 'ERROR during type insert')
    return unlockReturn('error, db not responds')
  }
  await updateEventNamesFromDB()
  return unlockReturn(true)
}



const getItems = async ({ userId, type, createdFrom, createdTo, sortDir, offset, limit }) => {

  const typeId = eventsCache && eventsCache.name2id && eventsCache.name2id[type] || null
  const errors = [];

  let query = `SELECT * FROM ${EVENT_TABLE} WHERE 1 `

  if (userId) {
    query = `${query} and user_id=${userId}`
  }

  if (typeId) {
    query = `${query} and type_id=${typeId}`
  } else if (type !== '') {
    errors.push(`no type ${type} detected, assume any type`)
  }

  if (createdFrom) {
    const date = moment(createdFrom);
    if (date.isValid()) {
      query = `${query} and created_at >= '${createdFrom}'`
    }
  }
  if (createdTo) {
    const date = moment(createdTo);
    if (date.isValid()) {
      query = `${query} and created_at <= '${createdTo}'`
    }
  }


  query = `${query} order by created_at ${sortDir}`


  if (limit) {
    query = `${query} limit ${limit}`
  }
  if (offset) {
    query = `${query} offset ${offset}`
  }


  log.trace({ query }, 'query trace')
  const [err, chResult] = await to(clickhouse.querying(query))

  if (err) {
    log.error(err, 'db select ERROR')
    throw new Error(err)
  }
  const valuesArr = clickhouseObj.getQueryValues(chResult, ['user_id', 'type_id', 'created_at', 'src', 'short_desc', 'currency', 'desc'])

  return {
    errors,
    values: valuesArr.reduce((returnArr, data) => {
      data.type = eventsCache.id2name[data.type_id]
      delete data.type_id
      return [...returnArr, data]
    }, [])
  }
}



/**
 *
 * @param {object} event - { name, src = '', desc = '', shortDesc = '', currency = '' }
 * @param {int} uId - user ID for event to assoc with
 */
const addItem = async (event, uId) => {
  const { name, src = '', desc = '', shortDesc = '', currency = '' } = event

  await update.allowToProceed()

  const typeId = eventsCache && eventsCache.name2id && eventsCache.name2id[name] || null

  if (!typeId) {
    throw new Error('event does not exist')
  }

  const nowDate = moment.utc().format('YYYY-MM-DD')
  const nowTime = moment.utc().format('YYYY-MM-DD HH:mm:ss')

  const values = {
    table: EVENT_TABLE,
    nowDate,
    typeId,
    uId,
    src,
    desc,
    shortDesc,
    currency,
    nowTime
  }

  const query = vsprintf(
    ['INSERT INTO %(table)s ',
      '(date, type_id, user_id, src, desc, short_desc, currency, created_at) ',
      "VALUES('%(nowDate)s', %(typeId)s, %(uId)s, '%(src)s', '%(desc)s', '%(shortDesc)s', '%(currency)s', '%(nowTime)s')"].join(''),
    values)

  log.trace({ query }, 'query trace')
  const [err, res] = await to(clickhouse.querying(query))

  if (err) {
    log.error(err, 'db insert ERROR')
    throw new Error(err)
  }
  log.trace(res, 'db insert result')

  return true
}

module.exports = {
  addItem,
  getItems,
  addType,
  getTypes
}

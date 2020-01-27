const server = require('fastify')()
const to = require('await-to-js').default

const log = require('../_sys/log').child({ module: 'rest.transport' })

const { api: { transportPort = 1202, transportHost = '0.0.0.0' } } = require('../_config')

let started = false

const EVENTS_PER_PAGE = 10
const MAX_EVENTS_PER_PAGE = 100
const MIN_EVENTS_PER_PAGE = 1

const addEventURL = '/event'

function attach(processor, statsCB) {
  // ATTACH url handlers

  /**
  * @swagger
  *
  * /event:
  *    post:
  *      description: ADD event to DB
  *      requestBody:
  *        description:
  *        required: true
  *        content:
  *          application/json:
  *            schema:
  *              type: object
  *              required:
  *                - uId
  *                - event
  *              properties:
  *                uId:
  *                  type: integer
  *                event:
  *                  type: object
  *                  required:
  *                    - name
  *                  properties:
  *                    name:
  *                      type: string
  *                      example: test
  *                    src:
  *                      type: string
  *                      example: test
  *                    desc:
  *                      type: string
  *                      example: test_long
  *                    shortDesc:
  *                      type: string
  *                      example: test_short
  *                    currency:
  *                      type: string
  *                      example: ltc
  *            example:
  *              uId: 1
  *              event:
  *                name: test
  *
  *      responses:
  *        '200':
  *          description: true/false
  *        '500':
  *          description: ERROR with database
  */
  server.post(addEventURL, async (req, res) => {
    const { uId, event } = req.body
    const [err, result] = await to(processor.addItem(event, uId))
    if (err) {
      log.error(err, { uId, event }, 'ERROR during processor.addItem')
      res.code(500)
        .send()
    } else {
      log.trace({ uId, event }, 'TRACE processor.addItem')
      res.send(result)
    }
  })


  /**
  * @swagger
  *
  * /events:
  *    get:
  *       description: GET paged events by user from DB
  *       parameters:
  *        - in: query
  *          name: user_id
  *          schema:
  *            type: integer
  *        - in: query
  *          name: type
  *          schema:
  *            type: string
  *        - in: query
  *          name: from
  *          schema:
  *            type: string
  *        - in: query
  *          name: to
  *          schema:
  *            type: string
  *        - in: query
  *          name: sort_direction
  *          schema:
  *            enum: ['desc', 'asc']
  *            default: 'desc' 
  *            type: string
  *        - in: query
  *          name: offset
  *          schema:
  *            default: 0
  *            type: integer
  *        - in: query
  *          name: limit
  *          schema:
  *            default: 10
  *            minimum: 1
  *            maximum: 100
  *            type: integer
  *       responses:
  *         '200':
  *           description: list of available event names
  *           content:
  *             application/json:
  *               schema:
  *                 type: object
  *                 properties:
  *                  status:
  *                    type: integer
  *                  count:
  *                    type: integer
  *                  offset:
  *                    type: integer
  *                  data:
  *                     type: object
  *                     properties:
  *                       errors:
  *                         type: array
  *                         items:
  *                           type: string
  *                       values:
  *                         type: array
  *                         items:
  *                           type: object
  *                           properties:
  *                             type:
  *                               type: string
  *                             user_id:
  *                               type: integer
  *                             created_at:
  *                               type: string
  *                             src:
  *                               type: string
  *                             short_desc:
  *                               type: string
  *                             desc:
  *                               type: string
  *                             currency:
  *                               type: string 
  *               example:
  *                 status: 0
  *                 count: 2
  *                 offset: 1
  *                 data:
  *                   errors: []
  *                   values:
  *                     - 
  *                       type: 'pin_set'
  *                       user_id: 1
  *                       created_at: '2019-01-01 10:10:12'
  *                       src: 'de'
  *                       short_desc: 'user pin set'
  *                       desc: 'user set pin for 10th times during this session'
  *                       currency: 'ltc'  
  *                     - 
  *                       type: 'passwd_chg'
  *                       user_id: 23
  *                       created_at: '2019-01-02 12:14:42'
  *                       src: 'de'
  *                       short_desc: 'user pass chg'
  *                       desc: '...'
  *                       currency: 'btc'  
  *         '500':
  *           description: ERROR with database
  */
  server.get('/events', async (req, res) => {

    const userId = req.query.user_id && Number(req.query.user_id) || false
    const type = req.query.type || ''
    const createdFrom = req.query.from || false
    const createdTo = req.query.to || false
    const sortDir = req.query.sort_direction || 'DESC'
    const offset = req.query.offset && Number(req.query.offset) || 0
    const limit = req.query.limit && Number(req.query.limit) || EVENTS_PER_PAGE

    const [err, data] = await to(processor
      .getItems({
        userId,
        type,
        createdFrom,
        createdTo,
        sortDir,
        offset,
        limit: Math.max(Math.min(limit, MAX_EVENTS_PER_PAGE), MIN_EVENTS_PER_PAGE)
      }))

    if (err) {
      log.error({ err, query: req.query }, 'ERROR processor.getEvents')
      res.code(500)
        .send({ status: -1, count: 0, error: 'db error' })
      return
    }
    log.trace({ query: req.query, data }, 'TRACE processor.getEvents')
    res.send({ status: limit > MAX_EVENTS_PER_PAGE ? 1 : 0, count: data.values.length, offset, data })
  })



  /**
  * @swagger
  *
  * /type:
  *    post:
  *      description: ADD event_type to DB
  *      requestBody:
  *        description:
  *        required: true
  *        content:
  *          application/json:
  *            schema:
  *              type: object
  *              required:
  *                - type
  *              properties:
  *                type:
  *                  type: object
  *                  required:
  *                    - name
  *                  properties:
  *                    name:
  *                      type: string
  *                      example: test
  *                    desc:
  *                      type: string
  *                      example: test_long
  *            example:
  *              type:
  *                name: test
  *                decs: Test_description
  *
  *      responses:
  *        '200':
  *          description: true/false
  *        '400':
  *          description: ERROR, such type already exists
  *        '500':
  *          description: ERROR with database
  */
  server.post('/type', async (req, res) => {
    const { type: { name, desc = '' } = {} } = req.body
    const [err, result] = await to(processor.addType(name, desc))
    if (err) {
      log.error(err, 'ERROR during processor.addType')
      if (err.message.includes('exists')) {
        res.code(400)
          .send('already exists')
      } else {
        res.code(500)
          .send('db error')
      }
    } else {
      log.trace({ name, desc }, 'TRACE processor.addType')
      res.send(result)
    }
  })

  /**
  * @swagger
  *
  *  /types:
  *     get:
  *       description: GET all types from DB
  *       parameters:
  *         - in: query
  *           name: force_update
  *           schema:
  *             default: 1
  *             type: bool
  *       responses:
  *         '200':
  *           description: list of available event names
  *           content:
  *             application/json:
  *               schema:
  *                 type: array
  *                 items:
  *                   type: string
  *               example:
  *                 - pass_chg
  *                 - pin_alter
  *         '500':
  *           description: ERROR with database
  */

  server.get('/types', async (req, res) => {
    const forceUpdate = req.query.force_update || false
    const result = await processor.getTypes(forceUpdate)
    log.trace({ result, forceUpdate }, 'TRACE processor.getTypes')
    res.send(result)
  })

  // PROSESS STATS WITH Hooks
  if (typeof statsCB === 'function') {
    // collect stats    
    server.addHook('onResponse', (req, rep, done) => {
      if (req.raw.url === addEventURL) {
        const stats = {
          method: req.raw.method,
          url: req.raw.url,
          dur: rep.getResponseTime(),
          failed: rep.res.statusCode > 400
        }
        statsCB(stats)
      }
      done()
    })
  }
}

const start = async (processor, statsCB) => {
  if (started !== false) {
    return started
  }
  started = null

  attach(processor, statsCB)

  const [err, address] = await to(server.listen(transportPort, transportHost))
  if (err) {
    log.error(err, 'An ERROR during transport server startup')
    started = false
    throw err
  }
  started = true
  log.info('Transport API is listening at %s', server.name, address)
  return started
}

const stop = async () => {
  if (started !== true) {
    return true
  }
  const [res, err] = await to(server.close())
  if (!err) {
    started = false
    return res
  }
  return err
}

module.exports = {
  server,
  start,
  stop
}

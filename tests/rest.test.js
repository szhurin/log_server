/**
 * for tests to work docker-compose needs to be up
 * & local service can be started with "npm start" (docker service should be stopped with  "docker stop security_log")
 */

/* global test, expect */

const moment = require('moment')
const axios = require('axios')

const { sleep } = require('./_utils/async')
const clickhouse = require('./_utils/clickhouse')

const trHost = process.env.API_TEST_REQUEST_HOST || '127.0.0.1'
const trPort = process.env.API_TEST_REQUEST_PORT || process.env.API_TRANSPORT_PORT || 1202

const USER_ID = 3
const TEST_EVENT_NAME = 'test'

test('clickhouse rest write test', async (done) => {
  await sleep(1000)
  const data = { uId: USER_ID, event: { name: TEST_EVENT_NAME, desc: 'rest test' } }

  const startTS = Math.floor(Date.now() / 1000)
  const reqResult = await axios({
    method: 'post',
    url: `http://${trHost}:${trPort}/event`,
    headers: '',
    data
  })
  const endTS = Math.floor(Date.now() / 1000)

  expect(reqResult.status).toBe(200)
  expect(reqResult.data).toBe(true)

  const res = await clickhouse.getLastItem('test', 1)

  expect(Array.isArray(res.data)).toBe(true)
  expect(res.data.length).toBe(1)
  const resItem = res.data[0]
  const resMeta = res.meta
  const typeId = resItem[resMeta.findIndex(el => el.name === 'type_id')]
  const userId = resItem[resMeta.findIndex(el => el.name === 'user_id')]
  const time = resItem[resMeta.findIndex(el => el.name === 'created_at')]

  const timeTS = parseFloat(moment.utc(time, 'YYYY-MM-DD HH:mm:ss').format('X'), 10)

  expect(typeId).toBe(1)
  expect(userId).toBe(1)

  // expect(timeTS).toBeGreaterThanOrEqual(startTS) // possible time problems with diff users
  expect(timeTS).toBeLessThanOrEqual(endTS)

  console.log(res.statistics, time)

  done()
})


/**
 * for tests to work docker-compose needs to be up
 * & local service can be started with "npm start" (docker service should be stopped with  "docker stop security_log")
 */

/* global test, expect */

const axios = require('axios')
const to = require('await-to-js').default

const clickhouse = require('./_utils/clickhouse')

const trHost = process.env.API_TEST_REQUEST_HOST || '127.0.0.1'
const trPort = process.env.API_TEST_REQUEST_PORT || process.env.API_TRANSPORT_PORT || 1202

const typeName = 'test_name'
const typeNameDesc = 'test_name_desc'

test('clickhouse type write test', async (done) => {
  const data = { type: { name: typeName, desc: typeNameDesc } }

  const reqResult = await axios({
    method: 'post',
    url: `http://${trHost}:${trPort}/type`,
    headers: '',
    data
  })

  expect(reqResult.status).toBe(200)
  expect(reqResult.data).toBe(true)

  const res = await clickhouse.getType(typeName)

  expect(Array.isArray(res.data)).toBe(true)
  expect(res.data.length).toBe(1)
  const resItem = res.data[0]
  const resMeta = res.meta
  const name = resItem[resMeta.findIndex(el => el.name === 'name')]
  const desc = resItem[resMeta.findIndex(el => el.name === 'desc')]

  expect(name).toBe(typeName)
  expect(desc).toBe(typeNameDesc)

  await clickhouse.delType(typeName)

  done()
})

const typeName2 = 'test_name2'
const typeNameDesc2 = 'test_name_desc2'

test('clickhouse same type write test', async (done) => {
  const data = { type: { name: typeName2, desc: typeNameDesc2 } }

  const [[err1, res1], [err2, res2]] = await Promise.all([
    to(axios({
      method: 'post',
      url: `http://${trHost}:${trPort}/type`,
      headers: '',
      data
    })),
    to(axios({
      method: 'post',
      url: `http://${trHost}:${trPort}/type`,
      headers: '',
      data
    }))
  ])

  const status1 = (res1 && res1.status) || (err1 && err1.response.status) || 0
  const status2 = (res2 && res2.status) || (err2 && err2.response.status) || 0

  const minStatus = Math.min(status1, status2)
  const maxStatus = Math.max(status1, status2)

  expect(minStatus).toBe(200)
  expect(maxStatus).toBe(400)

  await clickhouse.delType(typeName2)

  done()
})

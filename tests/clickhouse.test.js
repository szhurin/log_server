/**
 * for tests to work docker-compose needs to be up
 * & local service can be started with "npm start" (docker service should be stopped with  "docker stop security_log")
 */

/* global test, expect */

const moment = require('moment')

const clickhouse = require('../src/utils/clickhouse')

const testResult = {
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
  data: [
    ['2019-08-28', 1, 1, '2019-08-28 17:35:18', '', '', '', ''],
    ['2019-08-29', 2, 3, '2019-08-29 18:36:19', '', '', '', '']
  ],
  rows: 1,
  rows_before_limit_at_least: 8,
  statistics: { elapsed: 0.000656849, rows_read: 8, bytes_read: 384 },
  transferred: 637
}

test('clickhouse result parsing test', async (done) => {

  const res = await clickhouse.getQueryValues(testResult, ['date', 'type_id'])

  expect(Array.isArray(res)).toBe(true)
  expect(res.length).toBe(testResult.data.length)

  expect(res[0].date).toBe(testResult.data[0][0])
  expect(res[0].type_id).toBe(testResult.data[0][1])
  expect(res[1].date).toBe(testResult.data[1][0])
  expect(res[1].type_id).toBe(testResult.data[1][1])

  done()
})

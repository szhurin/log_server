const client = require('prom-client');
const gcStats = require('prometheus-gc-stats');

const to = require('await-to-js').default

const clickhouse = require('../utils/clickhouse').getInstance()


const collectDefaultMetrics = client.collectDefaultMetrics;
const startGcStats = gcStats(client.register);

const COLLECT_INTERVAL = 3000

let inited = false

const ticksInMinute = 60000


const Counter = client.Counter;

const counters = {}

const status = async (statusProvider) => {
  const procStatus = statusProvider.getStatusObj().data;

  const processed = { status: 'OK', success: 0, fail: 0, clickhouse: true }

  const [err, res] = await to(clickhouse.pinging())
  if (!err) {
    processed.clickhouse = true
  } else {
    processed.clickhouse = false
  }

  Object.keys(procStatus).forEach(name => {
    const am = procStatus[name].am;
    const failedAm = procStatus[name].failedAm;
    processed.success += am
    processed.fail += failedAm
    if (!counters[name]) {
      counters[name] = {
        counterAm: new Counter({ name: `${name}_success`, help: `${name} success counter` }),
        counterFailedAm: new Counter({ name: `${name}_fail`, help: `${name} fail counter` }),
        lastValues: { am, failedAm },
        firstTime: true
      }
    }
    const current = counters[name]
    let amDelta = am - current.lastValues.am
    let failedAmDelta = failedAm - current.lastValues.failedAm
    if (current.firstTime) {
      current.counterAm.inc(am)
      current.counterFailedAm.inc(failedAm)
      current.firstTime = false
    } else {
      if (amDelta > 0) {
        current.counterAm.inc(amDelta)
        current.lastValues.am = am
      }
      if (failedAmDelta > 0) {
        current.counterFailedAm.inc(failedAmDelta)
        current.lastValues.failedAm = failedAm
      }
    }
  })
  return processed;
}

const init = (server, statusProvider) => {
  if (inited) {
    return
  }
  inited = true
  collectDefaultMetrics({
    timeout: COLLECT_INTERVAL,
  });
  startGcStats();
  client.register.metrics();

  server.get('/metrics', async (req, res) => {
    const [err] = await to(status(statusProvider));
    if (!err) {
      res.header('Content-Type', client.register.contentType);
      res.send(client.register.metrics());
    } else {
      res.code(500)
        .send()
    }
  })

  server.get('/health', async (req, res) => {
    const [err, response] = await to(status(statusProvider));
    if (!err) {
      res.header('Content-Type', 'json');
      res.send(JSON.stringify(response));
    } else {
      res.code(500)
        .send()
    }
  })
}

module.exports = {
  init,
  status
}
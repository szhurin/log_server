const { env } = process

module.exports = {
  logs: {
    level: env.LOG_LEVEL || 'trace' // trace, debug, info, warn, error, fatal
  },
  api: {
    statusPort: env.API_STATUS_PORT || 1201,
    statusHost: env.API_STATUS_HOST || '0.0.0.0',
    transportPort: env.API_TRANSPORT_PORT || 1202,
    transportHost: env.API_TRANSPORT_HOST || '0.0.0.0'
  },
  rabbit: { queueName: env.SECURIRY_QUEUE_NAME || 'security_log_queue' },
  // pgConfig: { dsl: env.PG_DSL || 'postgres://eva:eva@127.0.0.1:5432/eva' },
  clickhouseConfig: {
    auth: env.CLICKHOUSE_AUTH || null,
    port: env.CLICKHOUSE_PORT || 8123,
    host: env.CLICKHOUSE_HOST || 'localhost',
    pathname: env.CLICKHOUSE_PATH || '/',
    protocol: env.CLICKHOUSE_PROTOCOL || 'http:',
    typeTable: env.CLICKHOUSE_TYPES_TABLE_NAME,
    logsTable: env.CLICKHOUSE_EVENT_TABLE_NAME,
    canAddType: env.ABLE_TO_ADD_TYPE || true // TODO: THIS always be TRUE need to remove to be able to disable type add for some nodes in multi process setup
  }
}

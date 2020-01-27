FROM yandex/clickhouse-server

WORKDIR /docker-entrypoint-initdb.d
COPY docker/clickhouse/clickhouse_types_local.sql .
COPY docker/clickhouse/clickhouse_log_local.sql .
RUN cat /docker-entrypoint-initdb.d/clickhouse_types_local.sql /docker-entrypoint-initdb.d/clickhouse_log_local.sql > /docker-entrypoint-initdb.d/start_schema.sql
RUN rm -rf /docker-entrypoint-initdb.d/clickhouse*

WORKDIR /etc/clickhouse-server
COPY docker/clickhouse/users.xml .


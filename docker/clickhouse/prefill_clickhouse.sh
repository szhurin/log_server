
clickhouse-client --multiquery < ./docker/clickhouse/clickhouse_types_local.sql 
clickhouse-client --multiquery < ./docker/clickhouse/clickhouse_log_local.sql 

echo "Prefill done"

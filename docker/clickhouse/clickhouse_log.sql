CREATE TABLE IF NOT EXISTS alteration_log (
    date Date,
    type_id UInt16,
    user_id UInt32,
    created_at DateTime,
    src String,
    short_desc String,
    currency String,
    "desc" String
) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{layer}-{shard}/alteration_log', '{replica}')
PARTITION BY toYYYYMM(date)
ORDER BY (intHash32(user_id), type_id, created_at)
SAMPLE BY intHash32(user_id);

CREATE TABLE IF NOT EXISTS alteration_log_all AS alteration_log
ENGINE = Distributed( cluster_1, default, alteration_log , rand() )


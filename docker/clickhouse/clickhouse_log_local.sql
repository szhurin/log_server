CREATE TABLE IF NOT EXISTS alteration_log (
    date Date,
    type_id UInt16,
    user_id UInt32,
    created_at DateTime,
    src String,
    short_desc String,
    currency String,
    "desc" String
) ENGINE = MergeTree(date, (user_id, type_id, created_at), 8192);

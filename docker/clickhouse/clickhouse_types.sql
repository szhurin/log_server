CREATE TABLE IF NOT EXISTS alteration_types (
    date Date,
    id UInt16,
    name String,
    "desc" String
) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{layer}-{shard}/alteration_types', '{replica}')
PARTITION BY toYYYYMM(date)
ORDER BY (id);

CREATE TABLE IF NOT EXISTS alteration_types_all AS alteration_types
ENGINE = Distributed( cluster_1, default, alteration_types , rand() )

-- ------- TYPE_DATA -------
INSERT INTO alteration_types_all (id, name, "desc") VALUES (1, 'test', '-- test type');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (2, 'pin_set', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (3, 'pin_chg', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (4, 'passwd_chg', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (5, 'passwd_recover_start', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (6, '2fa_set', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (7, '2fa_chg', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (8, 'email_set', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (9, 'email_chg', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (10, 'email_verify', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (11, 'limit_set', '');
INSERT INTO alteration_types_all (id, name, "desc") VALUES (12, 'limit_chg', '');

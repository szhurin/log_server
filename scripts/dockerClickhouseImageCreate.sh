# list of command deeded for update of security log

#MIG_REPO_NAME=nexus.adam.loc:18889/security_log_clickhouse_dev:develop 

docker build --no-cache --pull -f ./docker/clickhouse/Dockerfile -t local_clickhouse .

# docker build --no-cache --pull -f ./docker/clickhouse/Dockerfile -t $MIG_REPO_NAME .
# docker push $MIG_REPO_NAME
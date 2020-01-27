# list of command deeded for update of security log image

# MIG_REPO_NAME=nexus.adam.loc:18889/security_log_testing:develop 

docker build --no-cache --pull -f ./docker/Testing.Dockerfile -t local_sec_log_test .

# docker build --no-cache --pull -f ./docker/Testing.Dockerfile -t $MIG_REPO_NAME .
# docker push $MIG_REPO_NAME
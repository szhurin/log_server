# list of command deeded for update of security log image

# MIG_REPO_NAME=nexus.adam.loc:18889/security_log:develop 

docker build --no-cache --pull -f ./docker/Dockerfile -t local_sec_log .

# docker build --no-cache --pull -f ./docker/Dockerfile -t $MIG_REPO_NAME .
# docker push $MIG_REPO_NAME
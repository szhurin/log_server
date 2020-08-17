# Security Log

Service needs several services to function properly

The following services needs to be up and running for security_log to work properly

> 1. clickhouse
> 2. rabbit

## API

for ease of interacting with service swagger has beed implemented on http://localhost:1202/docs  (1202 - API_TRANSPORT_PORT from process environment)
first interaction can be done using this interface

## prometheus

http://{{server_name}}:1201/metrics
http://{{server_name}}:1201/health

## workflow

service opens rest interface on 1202 port by default
service opens a listener on queue 'security_log_queue' in rabbit
service opens rest interface for status reporting (prometheus) on 1201 port by default

on received message of format {uId, event:{ name, src = '', desc = '', shortDesc = '', currency = '' }} service records event data into clickhouse DB with current time parameters


# Possible improvements

service is not fault tolerant - service operates on noAck rabbit channel (in case service restart message can be lost) + rest interface not guaranties query execution on timeout

clickhouse may need to be more fault tolerant, can be made to retry the query on network error, and possibly have queue of waiting requests
data in clickhouse may need to be rearranged (change table type and index) - to comply with search queries, only one index is allowed? but it is multi-column

in multi-process setup type add can be enabled by removing default value from config



# Testing

## testing environment

For testing environment following services need to be up and running
> 1. clickhouse
> 2. rabbit
> 3. security_log

All services are run in docker via docker-compose ("docker-compose up -d")

For correct execution of compose on developers machine needs to be set /etc/docker/daemon.json

> {  
>   "insecure-registries" : [ "nexus.adam.loc:18888", "nexus.adam.loc:18889" ],
>   "dns" : ["10.100.60.10"] 
> }

TL. TR. All setup are already done for you, to start testing (running local environment) got to [RUN tests](#runtests) section

---


### ClickHouse migration

#### Add types by swagger

need to go to http://localhost:1202/docs to get to swagger (1202 - API_TRANSPORT_PORT from process environment), 
1) check out current types by get request to /types
2) add type by making post request to /type

#### Alter clickhouse by hand
by starting default docker-compose configuration clickhouse comes with all needed data in it.
for the purpose of testing this service the only 2 actions that need to be performed are:
>> 1) adding new event type - can be performed manually in form as shown in './docker/clickhouse/clickhouse_types.sql' be careful not no duplicate type entries as there are no transaction
>>   update security_log_clickhouse_dev (is developer clickhouse image in nexus) can be done by executing ./scripts/dockerClickhouseImageCreate.sh
>> 2) removing old events on as needed bases, for not to bloat DB (should be rarely needed) 

in production environment DevOps will perform all needed actions

---
## <a name="runtests"></a>RUN tests

To run tests against new changes in service code, one needs perform next steps


### 1. Start test environment
// to start testing you need to make local environment available by 

>    $ npm run init_env

// this will copy ./src/_config/.env.example into ./.env file for default environment
// .env can be changed at any time on specific to local setup

// to start developer environment execute "docker-compose up -d"

>    $ docker-compose up -d

// or for update of all used images
    
>    $ docker-compose up --force-recreate --build -d    

// this will start all needed services including security_log (docker stop security_log - for stopping default service )
// -d - will detach logs of compose from console (logs can be viewed by "docker logs ContainerID/Name")  
// we can check if all services are started normally "docker ps -a" - all but security_log should be running for local testing
// it is better to wait several seconds for all components to be started, some services need some time to initialize 

### 2. Start altered program 

This step needed only if test are ran against current branch, (CI not setup yet)

some parameters can be overwritten for local & staging config by changing corresponding file in ./config/

// for staging environment
> NODE_ENV=staging npm start

// for local environment
> NODE_ENV=local npm start


// parameters for process environment can differ - should be complied with compose/node_env

### 3. Run tests

// start tests by calling following from root of the project
  >  $ npm run test


### 4. Diagnostics

// to start an image with different command (shell) to explore internals use
  >  docker run -ti --entrypoint=sh {{image_name}}

// to get into running container use
  >  docker exec -ti {{container_name}} sh

// to stop and remove all containers
  >  docker stop $(docker ps -a -q)

  >  docker rm $(docker ps -a -q)


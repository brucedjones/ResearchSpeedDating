#!/bin/bash          
docker kill speed
docker kill speeddata
docker rm speed
docker rm speeddata
docker build -t brucedjones/speed .
# run the mongo server
docker run -itd -p 27017 -v /c/Users/Bruce/DockerShared/speeddata:/data --name speeddata brucedjones/speeddata

# run the node server
docker run -it -p 41960:8080 --name speed --link speeddata:mongo -d brucedjones/speed
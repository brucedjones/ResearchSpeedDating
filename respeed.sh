#!/bin/bash          
docker kill speed
docker rm speed
docker build -t brucedjones/speed .

# run the node server
docker run -it -p 41960:8080 --name speed --link speeddata:mongo -d brucedjones/speed
Go inside test dir and run below,

docker pull grafana/k6
docker run --add-host=host.docker.internal:host-gateway -i grafana/k6 run - <test-script.js
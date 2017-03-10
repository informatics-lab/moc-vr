#!/usr/bin/env bash

# install docker
apt install docker.io -y

# Start Docker
service docker start

# Install Docker Compose
curl -L https://github.com/docker/compose/releases/download/1.11.2/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
usermod -aG docker ubuntu

# Create credentials.sh file
cat <<EOF > credentials.sh
${credentials_file}
EOF
source credentials.sh

# Create docker-compose.yml file
cat <<EOF > docker-compose.yml
${docker_compose_file}
EOF

# Create oauth2_proxy.cfg file
cat <<EOF > oauth2_proxy.cfg
${oauth2_proxy_config_file}
EOF

/usr/local/bin/docker-compose up -d
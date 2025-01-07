FROM mongo:latest

# Import the public key used by the package management system
RUN apt-get update && apt-get install -y gnupg curl && \
    curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -

# Create a list file for MongoDB
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Install mongodb-tools
RUN apt-get update && apt-get install -y mongodb-org-tools

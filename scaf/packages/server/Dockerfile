FROM node:20-slim

# Install netcat (nc) for health checking and libssl 1.1 for Prisma
RUN apt-get update && \
    apt-get install -y netcat-openbsd wget && \
    wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_amd64.deb && \
    dpkg -i libssl1.1_1.1.1f-1ubuntu2_amd64.deb && \
    rm -f libssl1.1_1.1.1f-1ubuntu2_amd64.deb && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies including Prisma
COPY package.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and startup script
COPY tsconfig.json ./
COPY src ./src
COPY start-dev.sh ./

# Make script executable
RUN chmod +x start-dev.sh

EXPOSE 4001

ENV NODE_ENV=development
CMD ["./start-dev.sh"]

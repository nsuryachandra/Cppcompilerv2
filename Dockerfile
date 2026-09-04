FROM node:20-bullseye-slim

# Install g++ and build essentials for C++ compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build static bundle and server
RUN npm run build

# Default port for Render
ENV PORT=10000
ENV NODE_ENV=production
EXPOSE 10000

CMD ["node", "dist/server.cjs"]

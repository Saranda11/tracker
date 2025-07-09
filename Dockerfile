FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dumb-init and curl
RUN apk add --no-cache dumb-init curl

# Create app directory structure
RUN mkdir -p api frontend

# Copy backend package files
COPY api/package*.json ./api/
WORKDIR /app/api
RUN npm ci --only=production

# Copy backend source
COPY api/ ./

# Copy frontend package files
WORKDIR /app/frontend
COPY front/package*.json ./
RUN npm ci

# Copy frontend source
COPY front/ ./

# Build frontend
RUN npm run build

# Install PM2 globally
RUN npm install -g pm2

# For CI testing, just run the API
WORKDIR /app
RUN echo 'module.exports = {\n\
  apps: [\n\
    {\n\
      name: "api",\n\
      script: "./api/server.js",\n\
      env: {\n\
        NODE_ENV: "production",\n\
        PORT: 5000\n\
      }\n\
    }\n\
  ]\n\
};' > ecosystem.config.js

# Create uploads directory
RUN mkdir -p uploads

# Expose ports
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start with PM2
CMD ["dumb-init", "pm2-runtime", "ecosystem.config.js"] 
# NextGen Justice V8 - Production Cloud Run Dockerfile
FROM node:22-slim

# Install ca-certificates for secure outbound API calls (Gemini API, Firebase)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies (including build tooling)
RUN npm install --legacy-peer-deps

# Copy application source code and configuration
COPY . .

# Build production client bundle and server bundle
RUN npm run build

# Default production environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Cloud Run standard listening port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start full-stack server
CMD ["node", "server.ts"]

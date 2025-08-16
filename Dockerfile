############################################
# Builder stage: install all deps and build #
############################################
FROM node:20-alpine AS builder

WORKDIR /app

# Only copy manifest first for better caching
COPY package*.json ./

# Install ALL dependencies (including dev) for build tools like tsc/rimraf
RUN npm install

# Copy the rest of the project
COPY . .

# Build TypeScript -> dist
RUN npm run build

############################################
# Runtime stage: slim image with prod deps  #
############################################
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy package manifests and install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Set environment variables (can be overridden by docker-compose)
ENV NODE_ENV=production

# Expose port (default 3000)
EXPOSE 3000

# Start the app
CMD ["node", "dist/server.js"]

# -----------------------------------------------------
# Builder stage - used to compile TypeScript to JavaScript
# -----------------------------------------------------
FROM node:23-alpine AS builder
# Version: 18.18.0 (Alpine 3.17)

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
# This is done before copying the rest of the code to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build the TypeScript application
RUN npm run build

# -----------------------------------------------------
# Production stage - minimal image for running the application
# -----------------------------------------------------
FROM node:23-alpine
# Version: 18.18.0 (Alpine 3.17)

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy only necessary files from builder stage
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Install only production dependencies
RUN npm ci --only=production

# Create a non-root user for security
RUN addgroup -S revolucare && \
    adduser -S revolucare -G revolucare

# Set proper ownership of application files
RUN chown -R revolucare:revolucare /app

# Switch to non-root user
USER revolucare

# Expose the port the application listens on
EXPOSE 3000

# Add health check to verify application is running correctly
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Define the command to run the application
CMD ["node", "dist/index.js"]
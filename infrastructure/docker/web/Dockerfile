# Builder stage
# Use node:18-alpine as the base image for building the Next.js application
FROM node:18-alpine AS builder

# Set working directory for the build process
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package.json and package-lock.json first for better layer caching
COPY src/web/package*.json ./

# Install dependencies exactly as specified in package-lock.json
# This creates a separate layer that will be cached unless package-lock.json changes
RUN npm ci

# Copy the Next.js application code
COPY src/web/ ./

# Build the Next.js application for production
# This generates a standalone output that can be run without Node.js
RUN npm run build

# Run any necessary postinstall scripts, including Prisma client generation
RUN npm run postinstall

# Production stage
# Use nginx:alpine as the minimal base image for serving the application
FROM nginx:alpine

# Copy static assets from builder stage
COPY --from=builder /app/.next/static /usr/share/nginx/html/_next/static

# Copy public assets from builder stage
COPY --from=builder /app/public /usr/share/nginx/html

# Copy standalone Next.js build output
COPY --from=builder /app/.next/standalone/. /usr/share/nginx/html

# Copy Nginx configuration for serving the application
COPY infrastructure/docker/web/nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions for web content
RUN chmod -R 755 /usr/share/nginx/html

# Create a non-root user to run Nginx
RUN adduser -D -u 1000 -g 'www' www && \
    mkdir -p /var/cache/nginx && \
    chown -R www:www /var/cache/nginx && \
    chown -R www:www /var/log/nginx && \
    chown -R www:www /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R www:www /var/run/nginx.pid

# Expose the port Nginx listens on
EXPOSE 80

# Add health check to verify Nginx is serving content correctly
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Switch to non-root user
USER www

# Start Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
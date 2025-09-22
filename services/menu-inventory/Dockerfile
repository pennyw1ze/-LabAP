FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy application code
COPY src/ ./src/

# Set ownership to node user
RUN chown -R node:node /app

# Expose port
EXPOSE 3001

# Switch to non-root user
USER node

# Start the application
CMD ["npm", "start"]
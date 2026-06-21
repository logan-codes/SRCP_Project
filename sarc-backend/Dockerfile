# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install all dependencies (including devDependencies for prisma client compilation)
RUN npm ci

# Copy prisma schema and config files
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json* ./

# Compile the Prisma Client
RUN npx prisma generate

# Copy the rest of the application files
COPY . .

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Set node environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV RUN_MODE=standalone

# Copy package configurations
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy generated Prisma Client and binaries from builder stage
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy application source files
COPY app.js server.js ./
COPY config ./config
COPY routes ./routes
COPY middleware ./middleware
COPY utils ./utils
COPY prisma/schema.prisma ./prisma/

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]

# FROM node:22-alpine

# WORKDIR /app

# COPY package*.json ./
# COPY prisma ./prisma/

# RUN npm install

# COPY . .

# RUN npm run build
# RUN npx prisma generate

# # Verify that the compiled files exist
# RUN ls -la dist/ || (echo "dist folder not found" && exit 1)
# RUN test -f dist/server.js || (echo "server.js not found" && exit 1)

# EXPOSE 5000

# CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./

FROM base AS development
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS builder
COPY . .
RUN npm run build
# Prune dev dependencies
RUN npm ci --omit=dev --ignore-scripts

FROM node:20-alpine AS production
WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 rentos && \
    adduser  -u 1001 -G rentos -s /bin/sh -D rentos

COPY --from=builder --chown=rentos:rentos /app/dist        ./dist
COPY --from=builder --chown=rentos:rentos /app/node_modules ./node_modules
COPY --from=builder --chown=rentos:rentos /app/prisma      ./prisma
COPY --chown=rentos:rentos package*.json ./

USER rentos
EXPOSE 3000

# Run migrations then start — ensures DB is ready before app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
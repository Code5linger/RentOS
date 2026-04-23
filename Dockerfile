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
RUN npm ci

FROM base AS development
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS builder
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
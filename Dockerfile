FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts

COPY . .

# Remove prisma.config.ts to avoid Prisma v7 configuration issues in Docker
RUN rm -f prisma.config.ts

# Generate Prisma client locally and include it in image
RUN npx prisma generate
RUN npm run build

# Verify that the compiled files exist
RUN ls -la dist/ || (echo "dist folder not found" && exit 1)
RUN test -f dist/server.js || (echo "server.js not found" && exit 1)

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
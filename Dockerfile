FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

# CMD ["node", "src/server.ts"]
# CMD ["node", "dist/server.js"] 
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
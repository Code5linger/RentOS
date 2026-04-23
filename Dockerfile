FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

RUN npm run build

EXPOSE 5000

# CMD ["node", "src/server.ts"]
CMD ["node", "dist/server.js"] 
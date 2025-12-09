FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev && npm rebuild better-sqlite3

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh && mkdir -p /data

ENV NODE_ENV=production
ENV DB_PATH=/data/finance.db
ENV SEED_DB=true

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]

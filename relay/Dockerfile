# syntax=docker/dockerfile:1

FROM node:lts-alpine AS base
WORKDIR /app

FROM base AS builder
COPY relay/package.json relay/package-lock.json ./
RUN npm ci
COPY relay/. ./
COPY schemas /schemas

FROM base AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app ./
COPY --from=builder /schemas /schemas
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "server.js"]

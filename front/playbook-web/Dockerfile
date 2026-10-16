# =========================
# Build Stage
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN corepack enable

RUN yarn install

COPY . .

RUN yarn build

# =========================
# Production Stage
# =========================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["yarn", "start"]
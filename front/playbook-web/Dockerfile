# ---------- base ----------
FROM node:22-alpine AS base
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable

# ---------- build ----------
FROM base AS builder
# NEXT_PUBLIC_* values are baked into the JS at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# ---------- run ----------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
# صورة تحتوي poppler-utils (لتحويل PDF إلى صور) بالإضافة إلى تطبيق Next.js كاملاً.
# مخصصة لاستضافات تدعم Docker مع قرص دائم (persistent volume) يُركَّب على /data.

FROM node:20-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends poppler-utils openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["./entrypoint.sh"]

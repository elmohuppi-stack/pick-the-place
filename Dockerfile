FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma/migrations ./prisma/migrations
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

RUN mkdir -p /app/data

# Copy prisma CLI + config module from builder for runtime migrations
# Only copy additional @prisma packages not already in standalone
COPY --from=builder /app/node_modules/prisma /app/node_modules/prisma
COPY --from=builder /app/node_modules/@prisma/config /app/node_modules/@prisma/config
COPY --from=builder /app/node_modules/@prisma/debug /app/node_modules/@prisma/debug
COPY --from=builder /app/node_modules/@prisma/engines /app/node_modules/@prisma/engines
COPY --from=builder /app/node_modules/@prisma/engines-version /app/node_modules/@prisma/engines-version
COPY --from=builder /app/node_modules/@prisma/fetch-engine /app/node_modules/@prisma/fetch-engine
COPY --from=builder /app/node_modules/@prisma/get-platform /app/node_modules/@prisma/get-platform

# Copy entrypoint script
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER nextjs

CMD ["/app/entrypoint.sh"]

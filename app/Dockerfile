# --- STAGE 1: Base ---
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- STAGE 2: Dependencies ---
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
# Install dependencies including devDependencies for build
RUN npm ci

# --- STAGE 3: Builder ---
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- STAGE 4: Runner (Production) ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder (not included in standalone)
COPY --from=builder /app/public ./public

# Set correct permissions for nextjs user
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build when output: 'standalone' is enabled
CMD ["node", "server.js"]

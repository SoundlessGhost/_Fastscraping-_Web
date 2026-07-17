# Fastscraping — production image.
#
# Three stages so the runtime carries no toolchain and no source: deps installs,
# builder compiles, runner ships only the standalone server plus static assets.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Native builds (sharp, pg) need these; they stay out of the final image.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The Prisma client is generated, not committed (it's gitignored), so it has to
# be built here before the app can typecheck or run.
RUN npx prisma generate
RUN npm run build

# Migrations run from here, not from the runtime image: the Prisma CLI drags in
# a chunk of node_modules that the server itself never imports, and the runner
# should carry only what it serves. compose runs this once, to completion,
# before the app starts.
FROM builder AS migrator
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# openssl is Prisma's runtime dependency; curl backs the healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/dashboard/login -o /dev/null || exit 1

CMD ["node", "server.js"]

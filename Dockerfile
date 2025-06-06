FROM node:23-slim AS base

ENV YARN_VERSION=4.9.1

RUN yarn set version $YARN_VERSION

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get -y --no-install-recommends install \
    openssl

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY .yarnrc.yml package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --immutable; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --immutable; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder

# Add secrets for the frontend here
# This will be baked into the bundle
ARG NEXT_PUBLIC_CLIENTVAR

# Skip env variable validation.
# Otherwise we would have to defined DATABASE_URL
# at build time
ENV SKIP_ENV_VALIDATION=1

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f yarn.lock ]; then yarn run build && yarn run build:scripts; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner

RUN apt-get update && apt-get -y --no-install-recommends install \
    curl \
    ca-certificates

# Install PID1
ENV PID1_VERSION=0.1.3.1
RUN curl -sSL "https://github.com/fpco/pid1/releases/download/v${PID1_VERSION}/pid1" -o /sbin/pid1 && \
    chown root:root /sbin/pid1 && \
    chmod +x /sbin/pid1

COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV HOME=/home/nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/drizzle ./drizzle

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/scripts/migrate.js ./scripts/
COPY --from=builder /app/build-scripts/createsuperuser.js ./scripts/
# Copy script dependencies that aren't included in standalone build
COPY --from=builder /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder /app/node_modules/postgres ./node_modules/postgres
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

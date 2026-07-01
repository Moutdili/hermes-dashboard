# ─── Build stage ───────────────────────────────────────────
FROM docker.io/oven/bun:1.3 AS build
WORKDIR /app

ARG BACKEND_URL=http://backend:8899
ENV BACKEND_URL=${BACKEND_URL}

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ─── Runtime stage ─────────────────────────────────────────
FROM docker.io/node:20-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=15s \
  CMD node -e "fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

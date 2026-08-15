FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps

# Choose where the app live
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


# Build the application
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build


# Production image
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

CMD ["node", "server.js"]
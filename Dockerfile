# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:22-alpine AS builder

# pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .

# The approved family photos are stored as compact text payloads so they can be
# versioned reliably through the repository connector. Rebuild the WebP files
# inside the image before Vite copies public assets into dist.
RUN mkdir -p client/public/manus-storage \
  && base64 -d invite2/assets-src/mini-left.webp.b64 > client/public/manus-storage/chaewon-family-feeding.webp \
  && base64 -d invite2/assets-src/mini-center.webp.b64 > client/public/manus-storage/chaewon-family-together.webp \
  && base64 -d invite2/assets-src/mini-right.webp.b64 > client/public/manus-storage/chaewon-baby-swaddle.webp \
  && test "$(wc -c < client/public/manus-storage/chaewon-family-feeding.webp)" -gt 5000 \
  && test "$(wc -c < client/public/manus-storage/chaewon-family-together.webp)" -gt 5000 \
  && test "$(wc -c < client/public/manus-storage/chaewon-baby-swaddle.webp)" -gt 5000 \
  && test "$(head -c 4 client/public/manus-storage/chaewon-family-feeding.webp)" = "RIFF" \
  && test "$(head -c 4 client/public/manus-storage/chaewon-family-together.webp)" = "RIFF" \
  && test "$(head -c 4 client/public/manus-storage/chaewon-baby-swaddle.webp)" = "RIFF"

RUN pnpm build

# ─── Stage 2: Production ──────────────────────────────────────
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

ENV NODE_ENV=production

# All dependencies needed (vite is required at runtime for static serving)
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

# Copy built artifacts
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]

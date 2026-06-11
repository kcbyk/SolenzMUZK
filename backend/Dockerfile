# ─────────────────────────────────────────────
# Stage 1 — builder
# Compiles TypeScript to dist/
# ─────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install all deps (including devDependencies for tsc)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — production
# Lean image with Python + yt-dlp + ffmpeg
# ─────────────────────────────────────────────
FROM node:20-slim AS production

# Install system-level runtime deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-pip \
      ffmpeg \
      curl && \
    pip3 install --break-system-packages yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy production node_modules from builder
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Create download directory and assign ownership before dropping to node user
RUN mkdir -p /tmp/myt-downloads && chown -R node:node /tmp/myt-downloads

# Run as the built-in non-root node user
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]

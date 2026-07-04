# Dockerfile for ScheditGlobal Next.js frontend
# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app
# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
# Copy the rest of the source code
COPY . ./
# Build the Next.js app (optional for production)
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine AS runner
WORKDIR /app
# Copy only the necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# Install production dependencies only
RUN npm ci --omit=dev
EXPOSE 3000
ENV NODE_ENV production
# Start the Next.js server
CMD ["npm", "run", "start"]

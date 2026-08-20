# DEEN gateway container — build context is apps/api (set Root Directory = apps/api in Render)
FROM node:20-alpine

WORKDIR /app

# Install deps first for layer caching
COPY package*.json ./
RUN npm install --omit=dev=false

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 8787

# Runs `tsx src/index.ts` -> binds 0.0.0.0:$PORT (Render injects PORT)
CMD ["npm", "start"]

# ---- build stage ----
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

ARG VITE_CONTACT_EMAIL=
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
COPY client client
COPY server server
RUN npm run build

# ---- runtime stage ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3001 DATA_DIR=/data

COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --omit=dev -w server && npm cache clean --force

COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist

RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3001
WORKDIR /app/server
CMD ["node", "dist/index.js"]

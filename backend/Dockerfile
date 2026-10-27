FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV SEED_DEMO_DATA=true
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 3001
CMD ["sh", "-c", "if [ \"$SEED_DEMO_DATA\" = \"true\" ]; then npm run seed:demo; fi && npm run start:prod"]

FROM node:14-alpine as building

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --non-interactive && yarn cache clean

COPY ./tsconfig*.json ./
COPY ./src ./src

RUN yarn build

FROM node:14-alpine

ARG NODE_ENV="production"
ARG PORT=3000
ARG CORS_WHITELIST_REGEXP=
ARG GLOBAL_THROTTLE_TTL=
ARG GLOBAL_THROTTLE_LIMIT=
ARG GLOBAL_CACHE_TTL=
ARG SENTRY_DSN=
ARG LOG_LEVEL=
ARG LOG_FORMAT=

ENV NODE_ENV=$NODE_ENV \
  PORT=$PORT \
  CORS_WHITELIST_REGEXP=$CORS_WHITELIST_REGEXP \
  GLOBAL_THROTTLE_TTL=$GLOBAL_THROTTLE_TTL \
  GLOBAL_THROTTLE_LIMIT=$GLOBAL_THROTTLE_LIMIT \
  GLOBAL_CACHE_TTL=$GLOBAL_CACHE_TTL \
  SENTRY_DSN=$SENTRY_DSN \
  LOG_LEVEL=$LOG_LEVEL \
  LOG_FORMAT=$LOG_FORMAT

EXPOSE $PORT

RUN mkdir /app
WORKDIR /app

COPY --from=building /app/dist ./dist
COPY --from=building /app/node_modules ./node_modules
COPY ./package.json ./

RUN addgroup -S appgroup
RUN adduser -S appuser -G appgroup

USER appuser

HEALTHCHECK --interval=60s --timeout=10s --retries=3 \
  CMD sh -c "wget -nv -t1 --spider http://localhost:$PORT/health" || exit 1

CMD ["yarn", "start:prod"]

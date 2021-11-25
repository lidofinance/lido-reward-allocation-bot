FROM node:14-alpine as building

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --non-interactive && yarn cache clean

COPY ./tsconfig*.json ./
COPY ./manifests ./manifests
COPY ./src ./src

RUN yarn build

FROM node:14-alpine as prod

ARG NODE_ENV="production"
ARG PORT=3000
ARG LOG_LEVEL="debug"
ARG LOG_FORMAT="json"
ARG SENTRY_DSN=
ARG RESUBMIT_TX_TIMEOUT_SECONDS=300
ARG ERROR_TX_TIMEOUT_SECONDS=120

ENV NODE_ENV=$NODE_ENV \
  PORT=$PORT \
  SENTRY_DSN=$SENTRY_DSN \
  LOG_LEVEL=$LOG_LEVEL \
  LOG_FORMAT=$LOG_FORMAT \
  RESUBMIT_TX_TIMEOUT_SECONDS=$RESUBMIT_TX_TIMEOUT_SECONDS \
  ERROR_TX_TIMEOUT_SECONDS=$ERROR_TX_TIMEOUT_SECONDS \
  WALLET_PRIVATE_KEY=

EXPOSE $PORT

RUN mkdir /app
WORKDIR /app

COPY --from=building /app/dist ./dist
COPY --from=building /app/manifests ./manifests
COPY --from=building /app/node_modules ./node_modules
COPY ./package.json ./

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser

HEALTHCHECK --interval=60s --timeout=10s --retries=3 \
  CMD sh -c "wget -nv -t1 --spider http://localhost:$PORT/health" || exit 1

CMD ["yarn", "start:prod"]

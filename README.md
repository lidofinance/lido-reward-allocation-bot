## Lido Reward Allocation Bot

The bot is used to export metrics for reward programs and to send period start transactions. The supported programs are described in the [manifests directory](/manifests/). The file format is [described below](#manifest-format).

## Development

Step 1. Copy the contents of `sample.env` to `.env`:

```bash
cp sample.env .env
```

Step 2. Install dependencies:

```bash
$ yarn install
```

Step 3. Start the development server

```bash
$ yarn start:dev
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn build
$ yarn start:prod
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## Environment variables

The following variables are required for the bot to work:

```
RPC_URL=<rpc url>
WALLET_PRIVATE_KEY=<private key>
```

## Manifest format

Reward programs are described in the files in the [manifests directory](/manifests/). The top level contains the directory corresponding to the name of the network (`mainnet`, `rinkeby`, `goerli`, etc.). The current network is detected from the `RPC_URL`, which is passed to the application via env variables.

### File example

```json
{
  "name": "1inch v2",
  "version": "1.0.0",
  "metrics": [
    {
      "name": "isPeriodFinished",
      "request": {
        "type": "contractMethodCall",
        "address": "0xf5436129cf9d8fa2a1cb6e591347155276550635",
        "method": "function is_rewards_period_finished() view returns (bool)"
      }
    },
    {
      "name": "managerTokenBalance",
      "request": {
        "type": "contractMethodCall",
        "address": "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
        "method": "function balanceOf(address) view returns (uint256)",
        "args": ["0xf5436129cf9d8fa2a1cb6e591347155276550635"]
      }
    }
  ],
  "automation": [
    {
      "name": "startNextPeriodCall",
      "rules": {
        "and": [
          { "==": [{ "var": "isPeriodFinished" }, true] },
          { ">": [{ "var": "managerTokenBalance" }, 0] }
        ]
      },
      "request": {
        "type": "contractMethodSignedCall",
        "address": "0xf5436129cf9d8fa2a1cb6e591347155276550635",
        "method": "function start_next_rewards_period()"
      }
    }
  ]
}
```

### Manifest fields

- `name` — Reward program name
- `version` — Manifest version is used to track changes. Don't forget to increment the version when you change the file
- `metrics` — An array of [metrics](#metrics-fields) that you need to get from the network
- `automation` — An array of [metrics](#metrics-fields) to be run after collecting metrics

### Automation fields

Automations have the same fields as metrics. See details below.

### Metrics fields

- `name` — Metric name
- `rules` — [JsonLogic](https://github.com/jwadhams/json-logic-js/) rules. The current block data and previously collected metrics (only available for automations) are passed as a second argument. So you can use this data for conditions for running the request.
- `request` — The [request](#request-fields) to be executed

### Request fields

- `type` — One of the [request types](#request-types)
- `address` — Contract address,
- `method` — Contract method ABI in [Human-Readable format](https://docs.ethers.io/v5/api/utils/abi/formats/#abi-formats--human-readable-abi), for example: "function balanceOf(address) view returns (uint256)",
- `args` — An array of arguments, that should be passed to the contract method call

### Request types:

- `contractMethodCall` — Uses to call the view contract methods
- `contractMethodSignedCall` - Uses to call contract methods that require a transaction to be sent

## Prometheus metrics

The bot exports metrics with the prefix `lido_reward_allocation_bot_`

The following metrics must be present:

### Build information

- metric: `build_info`
- type: `counter`
- labels:
  - network — connected ethereum network from rpc
  - address — wallet address
  - name — the app name
  - version — the app version

### RPC request duration

- metric: `rpc_requests_duration_seconds`
- type: `histogram`

### Number of RPC requests errors

- metric: `rpc_requests_errors_total`
- type: `counter`

### Account balance

- metric: `account_balance`
- type: `gauge`
- labels:
  - address — wallet address

### Metric request duration

- metric: `manifest_requests_duration_seconds`
- type: `histogram`
- labels:
  - manifestName — the reward program name
  - manifestVersion — the manifest version
  - metric — collected metric name

### Manifest metric values

- metric: `manifest_requests_result`
- type: `gauge`
- labels:
  - manifestName — the reward program name
  - manifestVersion — the manifest version
  - metric — collected metric name

### Number of manifest metric requests

- metric: `manifest_requests_total`
- type: `counter`
- labels:
  - manifestName — the reward program name
  - manifestVersion — the manifest version
  - metric — collected metric name
  - status — `success` or `error`

## Sending transactions

Transactions are sent when a request with the type `contractMethodSignedCall` is called. After a successful transaction is sent, the bot waits for `RESUBMIT_TX_TIMEOUT_SECONDS`. If after this time the transaction is still not confirmed, the bot will resend it with the same nonce. If transaction sending is failed, the bot will wait for `ERROR_TX_TIMEOUT_SECONDS` before resending it.

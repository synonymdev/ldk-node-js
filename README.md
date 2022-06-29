# Sample LDK node
The sample LDK node is a sandboxing environment to repoduce the current [LDK-Sample](https://github.com/lightningdevkit/ldk-sample) in javascript using the [TypeScript bindings](https://github.com/lightningdevkit/ldk-garbagecollected/). Note that this repository is currently experimental and thus a work in progress, so should be considered incomplete.

## Installation
1. git clone https://github.com/synonymdev/ldk-node-js (or fork)
1. cd ./ldk-node-js
1. npm i

# Configuration

Copy and edit the .env_sample file to match you local environment. LN_REMOTE_HOST is provided for quick connection testing. Alternatively use connectpeer(pubkey@host:port) from the REPL.

```
cp ./.env_sample ./.env
```

## Running Tests

```
npm run test
```

## Running Node REPL

```
npm run start-node
```

## Running Browser node

```
npm start
```

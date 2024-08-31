# Event Management Service

A busy online reservation system using NodeJS, Redis and Docker.

## Table of Contents

- [Design](#design)

## Design

The design document can be found [here](./docs/design.md).

## Pre-requisites

### asdf

Install asdf following this
[guide](https://asdf-vm.com/guide/getting-started.html#getting-started).

### Docker

Install Docker Desktop following this
[guide](https://docs.docker.com/engine/install/).

### Node.js

```sh
asdf plugin add nodejs
asdf plugin add task
```

### Git hooks

This repo using git hooks to ensure that the code is committed in a good state.
To install the hooks, run the following command:

```bash
git config core.hooksPath .githooks
```

## Quick start

Once all pre-requisites are met, ensure
[Docker Desktop](https://docs.docker.com/) is running and then run the the
following:

```sh
task start
```

## Configuration

The hold time can be configured with the `MAX_EVENT_SEAT_HOLD_TIME_IN_S`
environment variable. See the `docker-compose.yml` file for an example. By
default, this is set to 60s.

## Tests

Run tests as follows:

### In-memory integration tests

```sh
task test:int
```

Watch mode:

```sh
task test:int -- --watch
```

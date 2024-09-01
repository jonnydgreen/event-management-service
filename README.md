# Event Management Service

A busy online reservation system using NodeJS, Redis and Docker.

## Table of Contents

- [Design](#design)

## Design

The design document can be found [here](./docs/design.md).

## API Spec

The target API spec can be found [here](./openapi.yaml).

The generated API spec can be found [here](./openapi.yaml).

> **Note:** the generated API spec from the implementation won't exactly match
> the target spec due to the fact that it generates the spec. However, it will
> be equivalent.

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

In another terminal, interact with the service as follows:

### Create an Event

```sh
task call:create_event
```

Output:

```json
{
  "name": "hello",
  "totalSeats": 15,
  "id": "b7b1b82f-5583-4f83-b618-699dae6d1a8b"
}
```

Note the `id` field as `EVENT_ID` going forwards:

```sh
export EVENT_ID=b7b1b82f-5583-4f83-b618-699dae6d1a8b
```

### Get available Seats for an Event

```sh
task call:get_available_seats EVENT_ID=$EVENT_ID
```

Output:

```json
[
  {
    "id": "fc83f6e1-6c47-42db-8b7a-51f3c97a8151",
    "number": 1,
    "eventId": "b7b1b82f-5583-4f83-b618-699dae6d1a8b"
  }
  // ... 15 times
]
```

Select the seat you want to hold:

```sh
export SEAT_ID=fc83f6e1-6c47-42db-8b7a-51f3c97a8151
```

### Hold an available Seat for a User

```sh
task call:hold_event_seat_for_user EVENT_ID=$EVENT_ID SEAT_ID=$SEAT_ID
```

Check that the seat is not available by ensuring it's not in the returned list
from:

```sh
task call:get_available_seats EVENT_ID=$EVENT_ID
```

### Permanently reserve an available Seat for a User

```sh
task call:reserve_event_seat_for_user EVENT_ID=$EVENT_ID SEAT_ID=$SEAT_ID
```

Wait at least 60s (or however long you have configured it for) and check that
the seat is still not available by ensuring it's not in the returned list from:

```sh
task call:get_available_seats EVENT_ID=$EVENT_ID
```

## Configuration

The hold time can be configured with the `MAX_EVENT_SEAT_HOLD_TIME_IN_S`
environment variable. See the `docker-compose.yml` file for an example. By
default, this is set to 60s.

## Tests

Run tests as follows (this will also display the test coverage):

### In-memory integration tests

```sh
task test:int
```

Watch mode:

```sh
task test:int -- --watch
```

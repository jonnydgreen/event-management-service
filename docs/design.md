# Design

## Table of Contents

- [Description](#description)
- [Requirements](#requirements)
- [Resources](#resources)
- [Exploration](#exploration)
- [Proposed Solution](#proposed-solution)

## Description

> **Note:** before implementing, I would send this design document to the team
> for async review and if needed an in-person review. Once everyone is happy
> with the proposed solution, implementation would start.

The main goal is to create a service that supports a busy online reservation
system using NodeJS, Redis and Docker.

- Define endpoints for the following features:
  - Create an event.
    - An event consists of several seats. The total number of seats is required
      to create the event and it could be anything between 10 and 1,000
      (included).
  - List available seats for a given event.
    - The list of available seats should only include the seats that are not “On
      Hold” and not yet fully Reserved.
  - Hold a particular seat.
    - Users can “Hold” a seat for a limited amount of time. This is particularly
      useful when other parts of the system are, for example, completing the
      confirmation flow and payment.
    - In order to Hold a seat, your system will require the user identifier. For
      this exercise, the user will simply be identified by an UUID.
      - A user can hold a seat for a configured maximum time of seconds, after
        which the seat will become available to other users. You can default
        this to 60 seconds.
  - Reserve a particular seat.
    - A user can complete the reservation of a seat, only if the user is
      “Holding” the relevant seat. After the reservation, this seat becomes
      permanently assigned to the user.

## Requirements

- Define an API spec
- Ensure strong software architecture
- Define business logic
- Explore error handling
- Explore validation
- Explore authentication
- Explore logging and monitoring
- Define testing strategies

## Resources

- [Swagger Editor](https://editor.swagger.io/)
- [NestJS](https://docs.nestjs.com/)
- [Redis](https://redis.io/docs/latest/)
- [TypeScript](https://www.typescriptlang.org/)
- [`ioredis`](https://redis.github.io/ioredis/classes/Redis.html)
- [`@nifty-lil-tricks/monitoring`](https://www.npmjs.com/package/@nifty-lil-tricks/monitoring)
- [`@nifty-lil-tricks/testing`](https://www.npmjs.com/package/@nifty-lil-tricks/testing)
- [`redis-memory-server`](https://www.npmjs.com/package/redis-memory-server)
- [`jest`](https://jestjs.io/docs/getting-started)
- [asdf](https://asdf-vm.com/guide/getting-started.html)
- [Taskfile](https://taskfile.dev/)

## Exploration

### API design

The first thing to consider is the API design. This is considered before any
technical decisions are made to keep the design implementation agnostic. The
proposed spec (which was tested using
[Swagger Editor](https://editor.swagger.io/)) is as follows:

> **Note:** several comments have been left throughout the target spec
> highlighting thoughts and decisions.

The target OpenAPI spec is available at: [`openapi.yaml`](../openapi.yaml)

```yaml
openapi: '3.0.3'
info:
  title: Event Management Service
  description: A REST API service managing Event Seat reservations.
  version: 1.0.0
servers:
  - url: http://localhost:3000/v1alpha1
tags:
  - name: Event
    description: An Event.
  # Note, we could prepend Seat with Event to avoid future name conflicts
  # but this is unlikely in the context of this service so this is not done for
  # cleanliness of the model definition.
  - name: Seat
    description: A seat associated with an Event.
paths:
  /events:
    post:
      tags:
        - Event
      summary: Create an Event.
      description: Create an Event.
      operationId: createEvent
      requestBody:
        '$ref': '#/components/requestBodies/Event'
      # Notes on design:
      # - I would also implement a forbidden response here because only certain users
      #   should be able to create events but I have left this out in the interests of time.
      # - To clean things up and also reuse, I could create a series of response refs but
      #   have kept them explicitly defined for the time being
      responses:
        '201':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'
        '400':
          description: Bad Request Error
          content:
            application/json:
              schema:
                '$ref': '#/components/schemas/BadRequestError'
        '401':
          description: Unauthorized Error
          content:
            application/json:
              schema:
                '$ref': '#/components/schemas/UnauthorizedError'
        '422':
          description: Unprocessable Content Error
          content:
            application/json:
              schema:
                '$ref': '#/components/schemas/UnprocessableContentError'
      security:
        - bearerAuth: []
  /events/{eventId}/seats:
    # Note, there is no auth required for this endpoint.
    get:
      tags:
        - Seat
      summary: Get available Seats for an Event.
      description: Get available Seats for an Event.
      operationId: getAvailableSeatsByEvent
      parameters:
        - name: eventId
          in: path
          schema:
            type: string
            description: The ID of the Event in UUID format.
            format: uuid
          required: true
          example: bf9eec7d-9b97-46b8-9cfb-706a2862520b
      # Notes on design:
      # - To clean things up and also reuse, I could create a series of response refs but
      #   have kept them explicitly defined for the time being
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              # Note: pagination was not chosen here because the maximum number
              # of seats associated with an Event is 1000 which shouldn't provide much load
              # on the endpoint. In addition, we always want to return all the seats for an event.
              # However, if pagination was deemed necessary (with a data-driven
              # decision), it would be implemented using either offset or cursor-based
              # pagination, whichever is deemed more appropriate for the use-case.
              schema:
                type: array
                items:
                  '$ref': '#/components/schemas/Seat'
        '404':
          description: Not found Error
          content:
            application/json:
              schema:
                '$ref': '#/components/schemas/NotFoundError'
  /events/{eventId}/seats/{seatId}/hold:
    post:
      tags:
        - Seat
      summary: Hold an available Seat for a User.
      description: Hold an available Seat for a User.
      operationId: holdEventSeatForUser
      parameters:
        - name: eventId
          in: path
          schema:
            type: string
            description: The ID of the Event in UUID format.
            format: uuid
          required: true
          example: bf9eec7d-9b97-46b8-9cfb-706a2862520b
        - name: seatId
          in: path
          schema:
            type: string
            description: The ID of the Seat in UUID format.
            format: uuid
          required: true
          example: 922fc335-171f-4109-b2b0-5f1826cee53b
      # Notes on design:
      # - I would also implement a forbidden response here because only certain users
      #   should be able to hold event seats but I have left this out in the interests of time.
      # - To clean things up and also reuse, I could create a series of response refs but
      #   have kept them explicitly defined for the time being
      responses:
        # Could potentially return some information such as a holding ID
        # if this was deemed to be useful but for the sake of simplicity,
        # nothing is returned at this time.
        '204':
          description: Successful operation
        '401':
          description: Unauthorized Error
          content:
            application/json:
              schema:
                '$ref': '#/components/schemas/UnauthorizedError'
        '404':
          description: Not found Error
          content:
            application/json:
              schema:
                '$ref': '#/components/schemas/NotFoundError'
      security:
        - bearerAuth: []
  /events/{eventId}/seats/{seatId}/reserve:
    post:
      tags:
        - Seat
      summary: Permanently reserve an available Seat for a User.
      description: Permanently reserve an available Seat for a User.
      operationId: reserveEventSeatForUser
      parameters:
        - name: eventId
          in: path
          schema:
            type: string
            description: The ID of the Event in UUID format.
            format: uuid
          required: true
          example: bf9eec7d-9b97-46b8-9cfb-706a2862520b
        - name: seatId
          in: path
          schema:
            type: string
            description: The ID of the Seat in UUID format.
            format: uuid
          required: true
          example: 922fc335-171f-4109-b2b0-5f1826cee53b
      # Notes on design:
      # - I would also implement a forbidden response here because only certain users
      #   should be able to reserve event seats but I have left this out in the interests of time.
      # - To clean things up and also reuse, I could create a series of response refs but
      #   have kept them explicitly defined for the time being
      responses:
        # Could potentially return some information such as a holding ID
        # if this was deemed to be useful but for the sake of simplicity,
        # nothing is returned at this time.
        '204':
          description: Successful operation
        '401':
          description: Unauthorized Error
          content:
            application/json:
              schema:
                '$ref': '#/components/schemas/UnauthorizedError'
        '404':
          description: Not found Error
          content:
            application/json:
              schema:
                '$ref': '#/components/schemas/NotFoundError'
      security:
        - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      # In a production setting, this would be identified by a more
      # secure and flexible approach such as a [JWT](https://jwt.io/).
      # However, in the interests of time and simplicity, the user
      # will be identified by the contents of the base64 encoded API
      # token in the request headers.
      bearerFormat: Base64
  schemas:
    # In the interests of time and simplicity, I have kept these schemas relatively simple.
    # In a production setting, I would add additional metadata to aid the evolution of this
    # resource over time such as:
    #  - slug
    #  - createdOn
    #  - seats
    Event:
      type: object
      properties:
        id:
          type: string
          description: The ID of the Event in UUID format
          format: uuid
          example: 958a4b17-fb57-4667-a2bf-82a0924ddbca
        name:
          type: string
          description: The name of the Event
          example: 'Lord of the Rings extended edition marathon'
        totalSeats:
          type: integer
          description: The total number of seats associated with the Event
          example: 15
      required:
        - id
        - name
        - totalSeats
    # In the interests of time and simplicity, I have kept these schemas relatively simple.
    # In a production setting, I would add additional metadata to aid the evolution of this
    # resource over time such as:
    #  - slug
    #  - status
    #  - createdOn
    #  - reservedOn
    #  - reservedBy
    Seat:
      type: object
      properties:
        id:
          type: string
          description: The ID of the Seat in UUID format
          format: uuid
          example: 958a4b17-fb57-4667-a2bf-82a0924ddbca
        eventId:
          type: string
          description: The Event ID of the Seat in UUID format
          format: uuid
          example: bf9eec7d-9b97-46b8-9cfb-706a2862520b
        # Note, this is set to an integer for simplicity but this could be different according to the definition of a seat
        number:
          type: integer
          description: The number of the Seat
          example: 23
      required:
        - id
        - eventId
        - number
    # The error shape is determined by the following RFC: https://www.rfc-editor.org/rfc/rfc9457.html
    Error:
      type: object
      properties:
        type:
          type: string
          # Note, in this test this will resolve to the local file path for the error
          description: The type of the problem. This will resolve to the relevant documentation for the error in question.
          example: file://docs/errors.md#error
        status:
          type: integer
          description: The HTTP Status of the problem.
          example: 400
        title:
          type: string
          description: The short, human-readable summary of the problem.
          example: Error
        detail:
          type: string
          description: The human-readable explanation specific to this occurrence of the problem.
          example: Error details
      required:
        - type
        - status
        - title
    BadRequestError:
      # A technique to ensure we implement the error interface
      allOf:
        - $ref: '#/components/schemas/Error'
        - description: Bad request error
        - example:
            type: 'file://docs/errors.md#bad-request-error'
            status: 400
            title: 'Bad request error'
            detail: 'Bad request error details'
    UnauthorizedError:
      # A technique to ensure we implement the error interface
      allOf:
        - $ref: '#/components/schemas/Error'
        - description: Unauthorized error
        - example:
            type: 'file://docs/errors.md#unauthorized-error'
            status: 401
            title: 'Unauthorized error'
            detail: 'Unauthorized error details'
    UnprocessableContentError:
      # A technique to ensure we implement the error interface
      allOf:
        - $ref: '#/components/schemas/Error'
        - description: Unprocessable Content error
        - example:
            type: 'file://docs/errors.md#unprocessable-content-error'
            status: 422
            title: 'Unprocessable Content error'
            detail: 'Unprocessable Content error details'
    NotFoundError:
      # A technique to ensure we implement the error interface
      allOf:
        - $ref: '#/components/schemas/Error'
        - description: Not found error
        - example:
            type: 'file://docs/errors.md#not-found-error'
            status: 422
            title: 'Not found error'
            detail: 'Not found error details'
  requestBodies:
    Event:
      description: Event to be created
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
                description: The name of the Event
                example: 'Lord of the Rings extended edition marathon'
              numberOfSeats:
                type: integer
                description: The number of Seats required to create the Event
                minimum: 10
                maximum: 1000
            required:
              - name
              - numberOfSeats
      required: true
```

### Software architecture and patterns

In order to keep all related functionality together in one place for easier
maintenance, flexibility, and organisation, a domain-driven design will be
applied to the file structure. For example:

```txt
src
├── app.module.ts
├── event
│   ├── event.controller.ts
│   ├── event.mapper.ts
│   ├── event.model.ts
│   ├── event.module.ts
│   ├── event.repository.ts
│   └── event.service.ts
└── main.ts
```

> **Note:** because this is a single service, everything is put at the root of
> the repository. However, in a microservice system, a mono-repo would be used
> as it provides easier implementation of features without any affect on the
> user experience.

In order to implement the RESTful API for the above design,
[NestJS](https://docs.nestjs.com/) is a good choice because it also follows a
domain-driven design and provides an easy way to quickly define a RESTful API.
In addition, it provides the lots of features either out of the box or through
plugins, such as:

- Validation
- Authentication and Authorization
- OpenAPI support

In this system, there are two key resources:

- Event
- Seat

Here, the Seat is associated with an event so it makes sense that it should live
under the Event domain, especially as an Event is the root resource in this
instance.

In order to provide clear separation between stages of the data journey, the
following software architecture will be applied:

```mermaid
flowchart TD
    U(User)
    subgraph Application Layer
    C1(Controller 1)
    C2(Controller 2)
    CN(Controller N)
    end
    subgraph Service Layer
    S1(Service 1)
    S2(Service 2)
    SN(Service N)
    end
    subgraph Data Layer
    R(Redis)
    A(External APIs)
    end

    U --> C1
    U --> C2
    U --> CN
    C1 --> S1
    C2 --> S2
    CN --> SN
    S1 --> R
    S2 --> A
    SN --> R
    SN --> A
```

Each layer is defined as follows:

#### Application Layer

This is where the user requests are processed and deserialised at each
entrypoint to the system. For example, a RESTful endpoint. It is best to keep
this as thin as possible and delegate any business logic to the service layer.

#### Service Layer

This is where the core business logic is defined. It is agnostic to how the
request is received to allow for resiliency (i.e. it doesn't care whether it
came in via a RESTful endpoint or GraphQL resolver). It will integrate with the
data layer to fetch all the relevant data that is needed.

Note, this layer also encompasses a series of mappers which transform the data
to the required inputs and outputs.

#### Data Layer

This is where the system reaches out to external data stores. These are called
by the service layer.

The objective of this task is to use [Redis](https://redis.io/docs/latest/) to
store and serve the user and system data.

#### Should PostgreSQL (or other SQL-like solutions) be considered alongside this?

When looking at the API definition, it is clear that the data has the potential
to be relatively structured as it evolves and a SQL-like datastore is a good
match in this case. And when considering one of the key requirements to make the
user permanently assigned to the seat, then a data store with permanent data
storage is a consideration.

However, Redis itself does offer good availability and its feature set and data
structure fully satisfies the requirements of the system. Moreover, introducing
another data store alongside redis adds complexity that is not needed at this
time (especially when considering this tech test). If one were to introduce
PostgreSQL, then the following would need to be implemented and considered:

- Schema definition of the Event and Seat table, including any required mapping
  tables and views.
- Database client and/or choice of ORM (e.g. kysely, Prisma, Drizzle etc)
  - I would likely choose either Drizzle or Kysely based on their strong focus
    on documentation, stability, community support, and keeping things SQL-like.
- Database schema migrations
  - I would use what is available to the client/ORM to keep the database schema
    definition to a single source of truth.
- Database data migrations
  - Again, I would use the client/ORM as much as possible and separate out this
    process. In addition, any data migration would be made idempotent.
- Testing
- Cost (when deploying a production system)

For this tech test, PostgreSQL is not deemed necessary because Redis fully meets
the objective and requirements (in some ways better than PostgreSQL - e.g.
holding a seat) now and in the future. However, when applied in a production
system, it would be good to consider and review the persistent data requirements
of the system as well as the evolution of the data models going forward.

With this is mind, the system **should account for any future changes** in the
data store and also clients (for the same data store). This is covered in the
next section.

#### Repository pattern

In order to account for future data store changes, a contract between the
service and data layer that is agnostic of the underlying implementation is
needed. This provides resilience to future changes where the service layer would
not change (or even know) if one were to move away from redis as a data store or
even to a different redis client in the future. As a result, a
[Repository Pattern](https://deviq.com/design-patterns/repository-pattern) is an
excellent way of meeting this requirement.

> **Note:** if time permitted and in a production setting, a more thorough
> investigation of the available Redis clients would be completed.

For the redis client itself, a stable and simple redis client is recommended.
Here, [ioredis](https://redis.github.io/ioredis/classes/Redis.html) fits the
bill nicely.

> **Note:** the following will not be considered to allow for time constraints.
> However support would be added in production:
>
> - Redis password
> - Redis TLS connections

### Business logic

Now that the API and software & system architecture are defined, the next thing
to consider is how to expose the functionality. Let's start with the data in
Redis. There are 4 data stores to consider:

| Data                       | Key                                      | Type     | Notes                                                                                                                                                                                                                                                        |
| -------------------------- | ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Event`                    | `events/EVENT_ID`                        | `string` | All events and associated metadata are stored under this key                                                                                                                                                                                                 |
| `Event Seat`               | `events/EVENT_ID/seats`                  | `set`    | All event seats and associated metadata are stored under this key as a set. Given the hard limit of 1000 seats for an event, this allows us to fetch all associated seats for an event at once. This is a set to ensure no duplicates are stored.            |
| `Reserved Event Seat`      | `events/EVENT_ID/reserved-seats/SEAT_ID` | `string` | All reserved event seats and associated metadata are stored under this key. When held, these are set with a TTL, which means that one is able to easily infer the currently reserved seats through the uses of key patterns (as they would be filtered out). |
| `User Reserved Event Seat` | `users/USER_ID/events/EVENT_ID/seats`    | `set`    | All user reserved event seats and associated metadata are stored under this key. This is a set to ensure no duplicates are stored.                                                                                                                           |

With the data model defined, it then makes sense to consider the E2E flow of the
application. For this, we use a web sequence diagram:

```mermaid
sequenceDiagram
    participant Admin
    participant User
    participant API
    participant Redis

    Admin ->>+ API: Create event
    API ->>+ Redis: Create event
    Redis -->>- API: OK
    API ->>+ Redis: Create event seats list
    Redis -->>- API: OK
    API -->>- Admin: Created

    User ->>+ API: Get available seats for event
    API ->>+ Redis: Get associated seats for event
    Redis -->>- API: OK
    Note right of API: The below will filter out expired keys
    API ->>+ Redis: Get reserved seat keys for event
    Redis -->>- API: OK
    API -->>- User: Available seats

    User ->>+ API: Hold seat for event
    Note right of API: Use flow defined above to get available seats
    API ->> API: Get available seats for event and perform checks
    API ->>+ Redis: Set event seat as reserved with configured expiry
    Redis -->>- API: OK
    API -->>- User: Held

    User ->>+ API: Reserve seat for event
    API ->>+ Redis: Get held seat for event
    Redis -->>- API: OK
    API ->>+ Redis: Persist reserved event seat
    Redis -->>- API: OK
    API ->>+ Redis: Associate event seat with user
    Redis -->>- API: OK
    API -->>- User: Reserved
```

The above flow will be robust and will work at scale, although it has the
following weaknesses:

- Some minor Node.js processing required when working out the available seats.

The above should not pose an issue in the short and medium term so it is
recommended to stick with this approach as it will be the most simple and
therefore, maintainable.

#### If there is an issue in the Node.js processing

However, if there is an issue, then a list-based approach should be considered
that minimises work on Node.js servers. Rather than defining individual keys,
one defines a series of lists/sets and passes seats between these. However, one
would need to trigger the passing of seats between the lists/sets upon seat
reservation expiry.

Redis gives one the ability to trigger functionality upon certain events. Such
an example is when the held seat expires. To do this, one can configure
keyspaces events: `notify-keyspace-events` and listen for the expiry event:
`EX`.

This can be achieved in Node.js by setting up redis publish and subscription
channels and utilising the stream event APIs. When the publisher channel is
ready, business logic defined in the subscriber instance would then react to
expiry channel messages. When an expires message is received, the system will
extract the information and make the associated event seat available again.

For example, here is some pseudo code:

```typescript
class Repo {
  constructor() {
    this.#subscribeChannel = new Redis();
    this.#publishChannel = new Redis();
    this.#handleEventSeatExpiries();
  }

  #handleEventSeatExpiries(): void {
    this.#publishChannel.on("ready", () => {
      // configure keyspaces event and specify expiring events with "Ex"
      this.#publishChannel.config("SET", "notify-keyspace-events", "Ex");
    });

    // subscribe to the expiry events
    this.#subscribeChannel.subscribe("__keyevent@0__:expired");

    // listen for expiring event messages
    this.#subscribeChannel.on("message", async (channel, message) => {
      // retrieve key and value from expired key
      const result = /^events\/(.+)\/seats\/(.+)$/.exec(message);
      if (result) {
        // Make expired seat available
      }
    });
  }
}
```

> **Note:** it is worth noting that this will have some impact on the
> deployment. For example, if using GCP Cloud Run, CPU throttling will need to
> be turned off and a minimum instance count of at least 1 to ensure that
> messages are correctly and successfully processed by the receiver. Should this
> process fail, it will be important to have processes to ensure that expired
> event seats are eventually made available again.

This approach does introduce some complexity and even some new issues so it is
not recommended at this time. However, it is an option on the table should the
simpler approach be deemed insufficient.

### Error handling

Ideally the system should use a well-defined structure when handling errors and
in this instance, it makes sense to use the following RFC:
https://www.rfc-editor.org/rfc/rfc9457.html which aims to have well-defined
details for errors in HTTP responses. This has been approved for publication by
the Internet Engineering Steering Group (IESG). This is the recommended solution
so the errors will be structured as follows:

```yaml
type: object
properties:
  type:
    type: string
    # Note, in this test this will be the local file path for the error
    description: The type of the problem. This will resolve to the relevant documentation for the error in question.
    example: file://docs/errors.md#error
  status:
    type: integer
    description: The HTTP Status of the problem.
    example: 400
  title:
    type: string
    description: The short, human-readable summary of the problem.
    example: Error
  detail:
    type: string
    description: The human-readable explanation specific to this occurrence of the problem.
    example: Error details
required:
  - type
  - status
  - title
```

### Authentication and Authorization

As defined in the requirements, the user is identified by a UUID. In a
production setting, this would be identified by a more secure approach such as a
[JWT](https://jwt.io/). However, in the interests of time and simplicity, the
user will be identified by the contents of the base64 encoded Bearer token in
the request headers. For example:

| Header name     | Header value                                              | User ID                                |
| --------------- | --------------------------------------------------------- | -------------------------------------- |
| `authorization` | `Bearer NmU4NTllMjgtODZjMy00ZWI5LTk2NzQtZjQ4YWM4OWNjMWM1` | `6e859e28-86c3-4eb9-9674-f48ac89cc1c5` |

No authorization will be implemented at this time, but this would be considered
for a production system (e.g. admins would create events and users would reserve
seats). In this case, a permissions system would be used and a strong convention
for how what these permissions look like would be a critical part of the
solution.

### Validation

Validation works really well with NestJS model definition with the
[`class-validator`](https://www.npmjs.com/package/class-validator) package. At
this time, only basic validation will be applied to ensure that the data
satisfies the contracts and the key requirements of the tech test. This would be
implemented as follows: https://docs.nestjs.com/techniques/validation

### Logging and Monitoring

> **Note:** because of time constraints, this will not be implemented but it
> would be done in a production system.

In order to ensure sufficient observability of the system, logging, tracing and
metrics will be considered.

#### Logging

A logger instance will be defined and made available in the following contexts:

- Request context
- Server context

This will include a correlation ID which is crucial in identifying relevant logs
for a request (even across multiple systems). In addition, structured logging
would be implemented as it brings huge searchability benefits as well as the
ability to connect traces with logs and create logs-based metrics (budget
permitting).

#### OpenTelemetry

> **Note:** I have written a package `@nifty-lil-tricks/monitoring` to provide
> easy tracing of the system via decorators:
> https://www.npmjs.com/package/@nifty-lil-tricks/monitoring

In order to trace requests within the system, OpenTelemetry will be used for the
following reasons:

- Vendor agnostic
- Exports to all the major cloud providers
- Provides tracing and metrics
- Provides a Propagation API for distributed systems (not necessarily relevant
  here, but good for future proofing)
- Will provide logging in the future too

### Testing

> **Note:** to account for time constraints, the main focus will be in-memory
> integrations tests.

In terms of testing this API, a testing trophy pattern will be used to provide a
good balance between amount of tests one needs to write vs confidence the tests
give us in going to production. By focussing on in-memory integration tests
(calling the endpoint as realistically as possible but any integrations (such as
Redis) are realistically mocked/intercepted) and ensuring high test coverage,
the confidence in the final solution will be high.

For the test framework/runner, the
[Node.js test](https://nodejs.org/api/test.html) runner could be used but it
does not easily support TypeScript and is relatively new so it fails the
stability test requirement - something to keep an eye out for the future! As an
alternative, [`jest`](https://jestjs.io/docs/getting-started) is the next best
option as it has a stable API, supports TypeScript easily and has everything we
need.

The AAA testing pattern will be used as it a simple and clean way of defining
and structuring tests:

- Arrange
- Act
- Assert

The following test strategy will be applied:

#### Static test

This will be achieved out of the box by
[TypeScript](https://www.typescriptlang.org/).

#### Unit test

> **Note:** this will not be implemented but here is what I would do in a
> production system

Used for permutations of functionality that are hard to write integration test
for or when needed to test very specific circumstances of the internals.

These will live next to the files in question.

#### Integration test

Here, two types of integration test will be used:

- In-memory - integrations and data stores mocked/intercepted
  - To setup mocks, a test util package that I wrote will be used to define any
    setup plugins: https://www.npmjs.com/package/@nifty-lil-tricks/testing
  - To mock redis, the following package will be used:
    https://www.npmjs.com/package/redis-memory-server as it is well maintained
    and documented.

> **Note:** the following will not be implemented but here is what I would do

- Smoke - real integrations and data stores used

This will live in the `tests` folder.

#### E2E test

> **Note:** this will not be implemented but here is what I would do in a
> production system

E2E tests will be used to test the full E2E flow that a user will realistically
make. They will mainly focus on the happy path and some key error cases.

#### Performance testing

> **Note:** this will not be implemented but here is what I would do in a
> production system

Performance testing will be used to test the performance of the application
under realistic loads. Here
[`autocannon`](https://github.com/mcollina/autocannon) is a good option as it is
well documented, stable, and provides a strong user API.

#### Security testing

> **Note:** this will not be implemented but here is what I would do in a
> production system

There are several types of security that can be implemented:

- [SAST](https://en.wikipedia.org/wiki/Static_application_security_testing)
- [DAST](https://en.wikipedia.org/wiki/Dynamic_application_security_testing)

These will provide confidence that systems shipped to production have passed
basic security benchmarks.

#### Debugging

> **Note:** this will not be implemented but here is what I would do in a
> production system

In order to debug the system locally, debug support and subsequent profiles
would be setup such that the debugger can be started out of the box. An
important thing to consider is what editors developers generally use. This
design would assume most use VSCode and therefore follow this
[guide](https://code.visualstudio.com/docs/editor/debugging).

### Developer Tooling

This section covers all relevant developer tooling:

#### asdf

In order to centralise versions of tools and core packages within the system,
[asdf](https://asdf-vm.com/guide/getting-started.html) is a good option for
this.

#### Taskfile

When running scripts, [Taskfile](https://taskfile.dev/) is used because it is
simple to setup, easy to use, and provides a series of useful features (such as
dependent commands) to the developer.

## Proposed Solution

> **Note:** in a normal design document with more time to complete, I would make
> recommendations based on each explored aspect as there would potentially be
> more to consider. As a result, the proposed solution is fairly lightweight and
> predominantly refers to the relevant parts of the exploration.

### API design

Implement the API design as discussed in the exploration using NestJS.

> **Note:** the generated API spec from the implementation won't exactly match
> the target spec due to the fact that it generates the spec. However, it will
> be equivalent.

### Software architecture and patterns

Implement the software architecture and patterns as discussed in the
exploration:

- Domain-driven design
- Layered approach:
  - Application
  - Service
  - Data
- Use the repository pattern for the data layer

### Business logic

Implement the business logic flows as detailed in the exploration for each
endpoint:

- Create event
- Get available Seats for an Event
- Hold an available Seat for a User
- Permanently reserve an available Seat for a User

Use a test-driven approach to develop this business logic.

### Authentication and Authorization

Implement authentication-only using NestJS as discussed in the exploration.

### Error handling

Implement the error handling as discussed in the exploration and ensure that the
[error documentation](./errors.md) is correctly linked to each defined error in
the source code.

Ensure that each service method has a fallback Internal Server error for
unhandled errors.

### Validation

Implement the validation as discussed in the exploration using NestJS. Take a
basic approach and refine the contents if time allows.

### Logging and Monitoring

This will not be implemented as discussed.

However, a request context will be created and this is where the logging and
monitoring will go in a production system.

### Testing

Implement the in-memory integration testing as discussed in the exploration.
Ensure that sufficient coverage achieved when the tests are run.

For the test runner/framework, [`jest`](https://jestjs.io/docs/getting-started)
will be used.

### Developer Tooling

Implement the developer tooling as discussed in the exploration:

- asdf
- Taskfile

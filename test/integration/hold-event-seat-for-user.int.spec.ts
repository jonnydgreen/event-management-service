import { SetupTestsTeardown } from '@nifty-lil-tricks/testing';
import { AppModule } from '../../src/app.module';
import { CreateEventDto } from '../../src/event/event.model';
import {
  createAuthenticatedHeaders,
  createEvent,
  getAvailableSeats,
  holdSeat,
  RedisPluginResult,
  setupTests,
  sleep,
} from './_test-utils';

describe('Create Event', () => {
  let redisServer: RedisPluginResult;
  let teardownAllTests: SetupTestsTeardown;
  let teardownEachTest: SetupTestsTeardown;
  let appOrigin: string;

  beforeAll(async () => {
    const result = await setupTests({ redis: { active: true } });
    teardownAllTests = result.teardownTests;
    redisServer = result.outputs.redis.output;
  });

  beforeEach(async () => {
    process.env.REDIS_HOST = redisServer.host;
    process.env.REDIS_PORT = String(redisServer.port);
    const result = await setupTests({ server: { appModule: AppModule } });
    teardownEachTest = result.teardownTests;
    appOrigin = result.outputs.server.output.origin;
  });

  afterEach(async () => {
    await teardownEachTest();
  });

  afterAll(async () => {
    await teardownAllTests();
  });

  it('should hold an available event seat for a user', async () => {
    // Arrange
    const createEventBody: CreateEventDto = {
      name: 'Lord of the Rings extended edition marathon',
      numberOfSeats: 15,
    };
    const headers = createAuthenticatedHeaders();
    const [, event] = await createEvent(appOrigin, headers, createEventBody);
    const { id: eventId } = event;
    const [, getAvailableSeatsJson1] = await getAvailableSeats(
      appOrigin,
      eventId,
    );
    const [seat] = getAvailableSeatsJson1;

    // Act
    const response = await holdSeat(appOrigin, headers, eventId, seat.id);
    const [, getAvailableSeatsJson2] = await getAvailableSeats(
      appOrigin,
      eventId,
    );

    // Assert
    expect(response.status).toBe(204);
    expect(getAvailableSeatsJson2.map((s) => s.id)).not.toContain(seat.id);
    expect(getAvailableSeatsJson2).toHaveLength(
      createEventBody.numberOfSeats - 1,
    );
  });

  it('should error if an event seat is already held for a user', async () => {
    // Arrange
    const createEventBody: CreateEventDto = {
      name: 'Lord of the Rings extended edition marathon',
      numberOfSeats: 15,
    };
    const headers = createAuthenticatedHeaders();
    const [, event] = await createEvent(appOrigin, headers, createEventBody);
    const { id: eventId } = event;
    const [, getAvailableSeatsJson1] = await getAvailableSeats(
      appOrigin,
      eventId,
    );
    const [seat] = getAvailableSeatsJson1;

    // Act
    const response1 = await holdSeat(appOrigin, headers, eventId, seat.id);
    const [, getAvailableSeatsJson2] = await getAvailableSeats(
      appOrigin,
      eventId,
    );
    const response2 = await holdSeat(appOrigin, headers, eventId, seat.id);

    // Assert
    expect(response1.status).toBe(204);
    expect(getAvailableSeatsJson2.map((s) => s.id)).not.toContain(seat.id);
    expect(getAvailableSeatsJson2).toHaveLength(
      createEventBody.numberOfSeats - 1,
    );
    expect(response2.status).toBe(404);
    const response2Json = await response2.json();
    expect(response2Json).toEqual({
      type: 'file://docs/errors.md#event-not-found-error',
      status: 404,
      title: 'Not found Error',
      detail:
        'Event Seat is not available to be held by the user for reservation',
    });
  });

  it('should restore an available event seat for a user after the configured timeout has been reached', async () => {
    // Arrange
    const createEventBody: CreateEventDto = {
      name: 'Lord of the Rings extended edition marathon',
      numberOfSeats: 15,
    };
    const headers = createAuthenticatedHeaders();
    process.env.MAX_EVENT_SEAT_HOLD_TIME_IN_S = '1';
    const result = await setupTests({ server: { appModule: AppModule } });
    try {
      const appOrigin = result.outputs.server.output.origin;
      const [, event] = await createEvent(appOrigin, headers, createEventBody);
      const { id: eventId } = event;
      const [, getAvailableSeatsJson1] = await getAvailableSeats(
        appOrigin,
        eventId,
      );
      const [seat] = getAvailableSeatsJson1;

      // Act
      const response = await holdSeat(appOrigin, headers, eventId, seat.id);
      // If time allowed, I would investigate a better way of advancing time
      // using the test runner timers. Otherwise, this will be a slow running test
      await sleep(100);
      const [, getAvailableSeatsJson2] = await getAvailableSeats(
        appOrigin,
        eventId,
      );
      // If time allowed, I would investigate a better way of advancing time
      // using the test runner timers. Otherwise, this will be a slow running test
      await sleep(1000);
      const [, getAvailableSeatsJson3] = await getAvailableSeats(
        appOrigin,
        eventId,
      );

      // Assert
      expect(response.status).toBe(204);
      expect(getAvailableSeatsJson2.map((s) => s.id)).not.toContain(seat.id);
      expect(getAvailableSeatsJson2).toHaveLength(
        createEventBody.numberOfSeats - 1,
      );
      expect(getAvailableSeatsJson3.map((s: any) => s.id)).toContain(seat.id);
      expect(getAvailableSeatsJson3).toHaveLength(
        createEventBody.numberOfSeats,
      );
    } finally {
      await result.teardownTests();
      process.env.MAX_EVENT_SEAT_HOLD_TIME_IN_S = undefined;
    }
  });
});

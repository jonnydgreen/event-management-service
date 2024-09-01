import { SetupTestsTeardown } from '@nifty-lil-tricks/testing';
import { AppModule } from '../../src/app.module';
import { CreateEventDto } from '../../src/event/event.model';
import {
  createAuthenticatedHeaders,
  createEvent,
  getAvailableSeats,
  holdSeat,
  RedisPluginResult,
  reserveSeat,
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

  it('should reserve a held event seat for a user', async () => {
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
      const [, , , seat] = getAvailableSeatsJson1;
      await holdSeat(appOrigin, headers, eventId, seat.id);

      // Act
      const response = await reserveSeat(appOrigin, headers, eventId, seat.id);
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
      expect(getAvailableSeatsJson3.map((s) => s.id)).not.toContain(seat.id);
      expect(getAvailableSeatsJson3).toHaveLength(
        createEventBody.numberOfSeats - 1,
      );
      expect(getAvailableSeatsJson2).toEqual(getAvailableSeatsJson3);
    } finally {
      await result.teardownTests();
      delete process.env.MAX_EVENT_SEAT_HOLD_TIME_IN_S;
    }
  });

  it('should return a not found error if no event seat is held', async () => {
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
    const response = await reserveSeat(appOrigin, headers, eventId, seat.id);
    const [, getAvailableSeatsJson2] = await getAvailableSeats(
      appOrigin,
      eventId,
    );

    // Assert
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({
      type: 'file://docs/errors.md#event-not-found-error',
      status: 404,
      title: 'Not found Error',
      detail: 'No Event Seat is held by the user for reservation',
    });
    expect(getAvailableSeatsJson2).toEqual(getAvailableSeatsJson1);
  });

  it('should return a not found error if event seat is held by another user', async () => {
    // Arrange
    const createEventBody: CreateEventDto = {
      name: 'Lord of the Rings extended edition marathon',
      numberOfSeats: 15,
    };
    const otherHeaders = createAuthenticatedHeaders();
    const headers = createAuthenticatedHeaders();
    const [, event] = await createEvent(
      appOrigin,
      otherHeaders,
      createEventBody,
    );
    const { id: eventId } = event;
    const [, getAvailableSeatsJson1] = await getAvailableSeats(
      appOrigin,
      eventId,
    );
    const [, , seat] = getAvailableSeatsJson1;
    await holdSeat(appOrigin, otherHeaders, eventId, seat.id);

    // Act
    const response = await reserveSeat(appOrigin, headers, eventId, seat.id);

    // Assert
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({
      type: 'file://docs/errors.md#event-not-found-error',
      status: 404,
      title: 'Not found Error',
      detail: 'No Event Seat is held by the user for reservation',
    });
  });
});

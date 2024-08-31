import { SetupTestsTeardown } from '@nifty-lil-tricks/testing';
import { AppModule } from '../../src/app.module';
import { CreateEventDto } from '../../src/event/event.model';
import {
  createAuthenticatedHeaders,
  createEvent,
  getAvailableSeats,
  RedisPluginResult,
  setupTests,
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

  it('should get available seats for an event', async () => {
    // Arrange
    const createEventBody: CreateEventDto = {
      name: 'Lord of the Rings extended edition marathon',
      numberOfSeats: 15,
    };
    const headers = createAuthenticatedHeaders();
    const [, event] = await createEvent(appOrigin, headers, createEventBody);
    const { id: eventId } = event;

    // Act
    const [response, json] = await getAvailableSeats(appOrigin, eventId);

    // Assert
    expect(response.status).toBe(200);
    expect(json).toHaveLength(createEventBody.numberOfSeats);
  });
});

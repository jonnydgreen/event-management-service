import { SetupTestsTeardown } from '@nifty-lil-tricks/testing';
import { AppModule } from '../../src/app.module';
import { CreateEventDto } from '../../src/event/event.model';
import {
  createAuthenticatedHeaders,
  createEvent,
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

  it('should create an event', async () => {
    // Arrange
    const body: CreateEventDto = {
      name: 'Lord of the Rings extended edition marathon',
      numberOfSeats: 15,
    };
    const headers = createAuthenticatedHeaders();

    // Act
    const [response, json] = await createEvent(appOrigin, headers, body);

    // Assert
    expect(response.status).toBe(201);
    expect(json).toEqual({
      id: expect.any(String),
      name: body.name,
      totalSeats: body.numberOfSeats,
    });
  });

  it('should return an unauthorized error if no bearer token is provided', async () => {
    // Arrange
    const body: CreateEventDto = {
      name: 'Lord of the Rings extended edition marathon',
      numberOfSeats: 15,
    };
    const headers = new Headers({ 'content-type': 'application/json' });

    // Act
    const [response, json] = await createEvent(appOrigin, headers, body);

    // Assert
    expect(response.status).toBe(401);
    expect(json).toEqual({
      type: 'file://docs/errors.md#unauthorized-error',
      status: 401,
      title: 'Unauthorized Error',
      detail: 'Invalid authorization token',
    });
  });

  // Due to a missing feature in the nifty-lil-trick/testing package, it is not possible to test the validation
  // However, in a production system, I would also test the following:
  //  - should return an unprocessable content error if invalid input is supplied
  //  - should return an unprocessable content error if number of seats is less than 10
  //  - should return an unprocessable content error if number of seats is greater than 1000
});

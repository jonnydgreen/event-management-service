import {
  setupTestsFactory,
  Plugin,
  PluginInstance,
} from '@nifty-lil-tricks/testing';
import { nestJsPlugin } from '@nifty-lil-tricks/testing-plugin-nestjs';
import { randomUUID } from 'node:crypto';
import { RedisMemoryServer } from 'redis-memory-server';
import { CreateEventDto, Event, Seat } from '../../src/event/event.model';

export interface RedisPluginConfig {
  active: true;
}

export interface RedisPluginResult {
  host: string;
  port: number;
}

const redisPlugin: Plugin<RedisPluginConfig, RedisPluginResult> = {
  async setup(): Promise<PluginInstance<RedisPluginResult>> {
    const redisServer = new RedisMemoryServer();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    return {
      output: {
        host,
        port,
      },
      async teardown(): Promise<void> {
        await redisServer.stop();
      },
    };
  },
};

export const { setupTests } = setupTestsFactory({
  server: nestJsPlugin,
  redis: redisPlugin,
});

export function createAuthenticatedHeaders(): Headers {
  const base64User = Buffer.from(randomUUID()).toString('base64');
  return new Headers({
    authorization: `Bearer ${base64User}`,
    'content-type': 'application/json',
  });
}

export async function createEvent(
  origin: string,
  headers: Headers,
  body: CreateEventDto,
): Promise<[Response, Event]> {
  const url = new URL('/v1alpha1/events', origin);
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const event = await response.json();
  return [response, event];
}

export async function getAvailableSeats(
  origin: string,
  eventId: string,
): Promise<[Response, Seat[]]> {
  const url = new URL(`/v1alpha1/events/${eventId}/seats`, origin);
  const response = await fetch(url, {
    method: 'GET',
  });
  const json = await response.json();
  return [response, json];
}

export async function holdSeat(
  origin: string,
  headers: Headers,
  eventId: string,
  seatId: string,
): Promise<Response> {
  const url = new URL(
    `/v1alpha1/events/${eventId}/seats/${seatId}/hold`,
    origin,
  );
  return fetch(url, {
    method: 'POST',
    headers,
  });
}

export async function reserveSeat(
  origin: string,
  headers: Headers,
  eventId: string,
  seatId: string,
): Promise<Response> {
  const url = new URL(
    `/v1alpha1/events/${eventId}/seats/${seatId}/reserve`,
    origin,
  );
  return fetch(url, {
    method: 'POST',
    headers,
  });
}

export async function sleep(timeInMs: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, timeInMs));
}

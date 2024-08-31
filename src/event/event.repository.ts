import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '../config/config.service';
import { Context } from '../auth/auth.context';
import { basename } from 'path';

export const EventRepositoryProviderToken = Symbol('EventRepository');

// I would normally add doc-strings here for better visibility of what
// each method is doing.
export interface EventRepositoryContract {
  createEvent(ctx: Context, event: Event, seats: string[]): Promise<void>;
  getAvailableSeatsForEvent(ctx: Context, eventId: string): Promise<Seat[]>;
  holdEventSeatForUser(
    ctx: Context,
    userId: string,
    eventId: string,
    seatId: string,
    expiryInS: number,
  ): Promise<void>;
  getHeldEventSeatUserId(
    ctx: Context,
    eventId: string,
    seatId: string,
  ): Promise<string | undefined>;
  reserveEventSeatForUser(
    ctx: Context,
    userId: string,
    eventId: string,
    seatId: string,
  ): Promise<void>;
}

export interface Event {
  id: string;
  name: string;
  totalSeats: number;
}

export interface Seat {
  id: string;
}

@Injectable()
export class EventRepository implements EventRepositoryContract {
  // In a production environment I would move this to a cache service
  // in order to instantiate this client once and allow for better reusability
  readonly #redis: Redis;
  constructor(configService: ConfigService) {
    // In a production environment I would move this to a cache service
    // in order to instantiate the published and subscriber clients once
    // and allow for better reusability
    this.#redis = new Redis({
      host: configService.redis.host,
      port: configService.redis.port,
    });
  }

  // In a production environment I would move this to a cache service
  // in order to instantiate this client once and allow for better reusability
  // This is needed to ensure that the redis client disconnects gracefully
  onModuleDestroy(): void {
    this.#redis.disconnect();
  }

  async createEvent(
    ctx: Context,
    event: Event,
    seats: string[],
  ): Promise<void> {
    const { id: eventId } = event;
    await this.#redis.set(this.#eventKey(eventId), JSON.stringify(event));
    await this.#redis.sadd(this.#eventSeatsKey(eventId), ...seats);
  }

  async getReservedEventSeatIds(
    ctx: Context,
    eventId: string,
  ): Promise<string[]> {
    const keys = await this.#redis.keys(
      this.#reservedEventSeatKey(eventId, '*'),
    );
    return keys.map((key) => basename(key));
  }

  async getAvailableSeatsForEvent(
    ctx: Context,
    eventId: string,
  ): Promise<Seat[]> {
    const seats = await this.#redis.smembers(this.#eventSeatsKey(eventId));
    const reservedSeats = await this.getReservedEventSeatIds(ctx, eventId);
    return seats
      .filter((seat) => !reservedSeats.includes(seat))
      .map((id) => ({ id }));
  }

  async getHeldEventSeatUserId(
    ctx: Context,
    eventId: string,
    seatId: string,
  ): Promise<string | undefined> {
    const seat = await this.#redis.get(
      this.#reservedEventSeatKey(eventId, seatId),
    );
    if (seat) {
      return seat;
    }
  }

  async holdEventSeatForUser(
    ctx: Context,
    userId: string,
    eventId: string,
    seatId: string,
    expiryInS: number,
  ): Promise<void> {
    await this.#redis.setex(
      this.#reservedEventSeatKey(eventId, seatId),
      expiryInS,
      userId,
    );
  }

  async reserveEventSeatForUser(
    ctx: Context,
    userId: string,
    eventId: string,
    seatId: string,
  ): Promise<void> {
    await this.#redis.persist(this.#reservedEventSeatKey(eventId, seatId));
    await this.#redis.sadd(
      this.#userReservedEventSeatsKey(userId, eventId),
      seatId,
    );
  }

  #eventKey(eventId: string): string {
    return ['events', eventId].join('/');
  }

  #reservedEventSeatKey(eventId: string, seatId: string): string {
    return ['events', eventId, 'reserved-seats', seatId].join('/');
  }

  #eventSeatsKey(eventId: string): string {
    return ['events', eventId, 'seats'].join('/');
  }

  #userReservedEventSeatsKey(userId: string, eventId: string): string {
    return ['users', userId, 'events', eventId, 'seats'].join('/');
  }
}

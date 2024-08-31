import { Inject, Injectable } from '@nestjs/common';
import {
  EventRepositoryProviderToken,
  type EventRepositoryContract,
} from './event.repository';
import { CreateEventDto, Event, Seat } from './event.model';
import { Context, ensureUser } from '../auth/auth.context';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '../config/config.service';
import { EventNotFoundError } from './event.error';

// I would normally add doc-strings for each public method for better visibility of what
// each method is doing.

@Injectable()
export class EventService {
  readonly #configService: ConfigService;
  readonly #eventRepository: EventRepositoryContract;

  constructor(
    configService: ConfigService,
    @Inject(EventRepositoryProviderToken)
    eventRepository: EventRepositoryContract,
  ) {
    this.#configService = configService;
    this.#eventRepository = eventRepository;
  }

  async createEvent(ctx: Context, input: CreateEventDto): Promise<Event> {
    const numSeats = input.numberOfSeats;
    // If time allowed, I would create a mapper for all the input to get
    // the data in the correct format and isolate this code.
    const seats: string[] = [...Array(numSeats)].map((_, idx) =>
      String(idx + 1),
    );
    const eventId = randomUUID();
    const event: Event = {
      id: eventId,
      name: input.name,
      totalSeats: numSeats,
    };
    await this.#eventRepository.createEvent(ctx, event, seats);
    // If time allowed, I would create a mapper for the output to get
    // the data in the correct format and isolate this code.
    return event;
  }

  async getAvailableSeats(ctx: Context, eventId: string): Promise<Seat[]> {
    const availableSeats =
      await this.#eventRepository.getAvailableSeatsForEvent(ctx, eventId);
    // If time allowed, I would create a mapper for the output to get
    // the data in the correct format and isolate this code.
    return availableSeats.map((seat) => ({
      id: seat.id,
      eventId,
    }));
  }

  async holdSeatForUser(
    ctx: Context,
    eventId: string,
    seatId: string,
  ): Promise<void> {
    ensureUser(ctx);
    const seats = await this.#eventRepository.getAvailableSeatsForEvent(
      ctx,
      eventId,
    );
    if (!seats.some((s) => s.id === seatId)) {
      // In a production system, I would also log extra details to provide
      // the developer a better idea of what is happening as there is a similar
      // error. The error message is obscured for security reasons.
      throw new EventNotFoundError({
        cause:
          'Event Seat is not available to be held by the user for reservation',
      });
    }
    const expiryInS = this.#configService.maxEventSeatHoldTimeInS;
    const userId = ctx.user;
    await this.#eventRepository.holdEventSeatForUser(
      ctx,
      userId,
      eventId,
      seatId,
      expiryInS,
    );
  }

  async reserveSeat(ctx: Context, eventId: string, seatId: string) {
    ensureUser(ctx);
    const userId = ctx.user;
    const seatHoldUserId = await this.#eventRepository.getHeldEventSeatUserId(
      ctx,
      eventId,
      seatId,
    );
    if (!seatHoldUserId) {
      // In a production system, I would also log extra details to provide
      // the developer a better idea of what is happening as there is a similar
      // error. The error message is obscured for security reasons.
      throw new EventNotFoundError({
        cause: 'No Event Seat is held by the user for reservation',
      });
    }
    if (seatHoldUserId !== userId) {
      // In a production system, I would also log extra details to provide
      // the developer a better idea of what is happening as there is a similar
      // error. The error message is obscured for security reasons.
      throw new EventNotFoundError({
        cause: 'No Event Seat is held by the user for reservation',
      });
    }
    await this.#eventRepository.reserveEventSeatForUser(
      ctx,
      userId,
      eventId,
      seatId,
    );
  }
}

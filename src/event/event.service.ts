import { Inject, Injectable } from '@nestjs/common';
import {
  EventRepositoryProviderToken,
  type EventRepositoryContract,
  Seat as DbSeat,
} from './event.repository';
import { CreateEventDto, Event, Seat } from './event.model';
import { Context, ensureUser } from '../auth/auth.context';
import { ConfigService } from '../config/config.service';
import { EventInternalServerError, EventNotFoundError } from './event.error';
import { AppError } from '../errors/error';

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

  // Note: I always make sure to assign types to all function/method returns
  // and variable assignments to make sure we don't slow down the compilation
  // and run into slow type scenarios.
  async createEvent(ctx: Context, input: CreateEventDto): Promise<Event> {
    try {
      const numSeats = input.numberOfSeats;
      // If time allowed, I would create a mapper for all the input to get
      // the data in the correct format and isolate this code.
      const seats: Omit<DbSeat, 'id'>[] = [...Array(numSeats)].map(
        (_, idx) => ({
          number: idx + 1,
        }),
      );
      const eventInput: Omit<Event, 'id'> = {
        name: input.name,
        totalSeats: numSeats,
      };
      const event = await this.#eventRepository.createEvent(
        ctx,
        eventInput,
        seats,
      );
      // If time allowed, I would create a mapper for the output to get
      // the data in the correct format and isolate this code.
      return event;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new EventInternalServerError();
    }
  }

  async getAvailableSeats(ctx: Context, eventId: string): Promise<Seat[]> {
    try {
      const availableSeats =
        await this.#eventRepository.getAvailableSeatsForEvent(ctx, eventId);
      // If time allowed, I would create a mapper for the output to get
      // the data in the correct format and isolate this code.
      return availableSeats.map((seat) => ({
        id: seat.id,
        number: seat.number,
        eventId,
      }));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new EventInternalServerError();
    }
  }

  async holdSeatForUser(
    ctx: Context,
    eventId: string,
    seatId: string,
  ): Promise<void> {
    try {
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
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new EventInternalServerError();
    }
  }

  async reserveSeat(ctx: Context, eventId: string, seatId: string) {
    try {
      ensureUser(ctx);
      const userId = ctx.user;
      const seatHoldDetails =
        await this.#eventRepository.getHeldEventSeatDetails(
          ctx,
          eventId,
          seatId,
        );
      if (!seatHoldDetails?.userId) {
        // In a production system, I would also log extra details to provide
        // the developer a better idea of what is happening as there is a similar
        // error. The error message is obscured for security reasons.
        throw new EventNotFoundError({
          cause: 'No Event Seat is held by the user for reservation',
        });
      }
      if (seatHoldDetails.userId !== userId) {
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
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new EventInternalServerError();
    }
  }
}

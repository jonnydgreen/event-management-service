import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Context, Ctx } from '../auth/auth.context';
import { AuthGuard } from '../auth/auth.guard';
import { CreateEventDto, Event, Seat } from './event.model';
import { EventService } from './event.service';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableContentError,
} from '../errors/error.model';

@Controller()
export class EventController {
  readonly #eventService: EventService;

  constructor(eventService: EventService) {
    this.#eventService = eventService;
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('/v1alpha1/events')
  @ApiCreatedResponse({ description: 'Successful operation', type: Event })
  @ApiBadRequestResponse({
    description: 'Bad Request Error',
    type: BadRequestError,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Unprocessable Content Error',
    type: UnprocessableContentError,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized Error',
    type: UnauthorizedError,
  })
  async createEvent(
    @Ctx() ctx: Context,
    @Body() input: CreateEventDto,
  ): Promise<Event> {
    return this.#eventService.createEvent(ctx, input);
  }

  @Get('/v1alpha1/events/:eventId/seats')
  @ApiOkResponse({ description: 'Successful operation', type: [Seat] })
  @ApiNotFoundResponse({
    description: 'Not found Error',
    type: NotFoundError,
  })
  async getAvailableSeats(
    @Ctx() ctx: Context,
    @Param('eventId') eventId: string,
  ): Promise<Seat[]> {
    return this.#eventService.getAvailableSeats(ctx, eventId);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('/v1alpha1/events/:eventId/seats/:seatId/hold')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Successful operation' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized Error',
    type: UnauthorizedError,
  })
  @ApiNotFoundResponse({
    description: 'Not found Error',
    type: NotFoundError,
  })
  async holdSeatForUser(
    @Ctx() ctx: Context,
    @Param('eventId') eventId: string,
    @Param('seatId') seatId: string,
  ) {
    return this.#eventService.holdSeatForUser(ctx, eventId, seatId);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('/v1alpha1/events/:eventId/seats/:seatId/reserve')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Successful operation' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized Error',
    type: UnauthorizedError,
  })
  @ApiNotFoundResponse({
    description: 'Not found Error',
    type: NotFoundError,
  })
  async reserveSeat(
    @Ctx() ctx: Context,
    @Param('eventId') eventId: string,
    @Param('seatId') seatId: string,
  ) {
    return this.#eventService.reserveSeat(ctx, eventId, seatId);
  }
}

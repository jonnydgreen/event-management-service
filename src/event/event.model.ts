import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'The name of the Event', type: () => String })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'The number of Seats required to create the Event',
    type: () => Number,
    minimum: 10,
    maximum: 1000,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(10)
  @Max(1000)
  numberOfSeats!: number;
}

export class Event {
  @ApiProperty({
    description: 'The ID of the Event in UUID format',
    type: () => String,
    example: '958a4b17-fb57-4667-a2bf-82a0924ddbca',
  })
  id!: string;

  @ApiProperty({
    description: 'The name of the Event',
    type: () => String,
    example: 'Lord of the Rings extended edition marathon',
  })
  name!: string;

  @ApiProperty({
    description: 'The total number of seats associated with the Event',
    type: () => Number,
    example: 15,
  })
  totalSeats!: number;
}

export class Seat {
  @ApiProperty({
    description: 'The ID of the Seat in UUID format',
    type: () => String,
    example: '958a4b17-fb57-4667-a2bf-82a0924ddbca',
  })
  id!: string;

  @ApiProperty({
    description: 'The number of the Seat',
    type: () => Number,
    example: 23,
  })
  number!: number;

  @ApiProperty({
    description: 'The Event ID of the Seat in UUID format',
    type: () => String,
    example: 'bf9eec7d-9b97-46b8-9cfb-706a2862520b',
  })
  eventId!: string;
}

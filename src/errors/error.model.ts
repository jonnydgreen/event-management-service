import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BadRequestError {
  @ApiProperty({
    description:
      'The type of the problem. This will resolve to the relevant documentation for the error in question.',
    type: () => String,
    example: 'file://docs/errors.md#bad-request-error',
  })
  type!: string;

  @ApiProperty({
    description: 'The HTTP Status of the problem.',
    type: () => Number,
    example: 400,
  })
  status!: number;

  @ApiProperty({
    description: 'The short, human-readable summary of the problem.',
    type: () => String,
    example: 'Error',
  })
  title!: string;

  @ApiPropertyOptional({
    description:
      'The human-readable explanation specific to this occurrence of the problem.',
    type: () => String,
    example: 'Error details',
  })
  detail?: string;
}

export class UnauthorizedError {
  @ApiProperty({
    description:
      'The type of the problem. This will resolve to the relevant documentation for the error in question.',
    type: () => String,
    example: 'file://docs/errors.md#unauthorized-error',
  })
  type!: string;

  @ApiProperty({
    description: 'The HTTP Status of the problem.',
    type: () => Number,
    example: 401,
  })
  status!: number;

  @ApiProperty({
    description: 'The short, human-readable summary of the problem.',
    type: () => String,
    example: 'Error',
  })
  title!: string;

  @ApiPropertyOptional({
    description:
      'The human-readable explanation specific to this occurrence of the problem.',
    type: () => String,
    example: 'Error details',
  })
  detail?: string;
}

export class UnprocessableContentError {
  @ApiProperty({
    description:
      'The type of the problem. This will resolve to the relevant documentation for the error in question.',
    type: () => String,
    example: 'file://docs/errors.md#unprocessable-content-error',
  })
  type!: string;

  @ApiProperty({
    description: 'The HTTP Status of the problem.',
    type: () => Number,
    example: 422,
  })
  status!: number;

  @ApiProperty({
    description: 'The short, human-readable summary of the problem.',
    type: () => String,
    example: 'Error',
  })
  title!: string;

  @ApiPropertyOptional({
    description:
      'The human-readable explanation specific to this occurrence of the problem.',
    type: () => String,
    example: 'Error details',
  })
  detail?: string;
}

export class NotFoundError {
  @ApiProperty({
    description:
      'The type of the problem. This will resolve to the relevant documentation for the error in question.',
    type: () => String,
    example: 'file://docs/errors.md#not-found-error',
  })
  type!: string;

  @ApiProperty({
    description: 'The HTTP Status of the problem.',
    type: () => Number,
    example: 404,
  })
  status!: number;

  @ApiProperty({
    description: 'The short, human-readable summary of the problem.',
    type: () => String,
    example: 'Error',
  })
  title!: string;

  @ApiPropertyOptional({
    description:
      'The human-readable explanation specific to this occurrence of the problem.',
    type: () => String,
    example: 'Error details',
  })
  detail?: string;
}

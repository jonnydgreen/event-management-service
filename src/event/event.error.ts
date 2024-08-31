import { AppError, type AppExceptionOptions } from '../errors/error';

export class EventNotFoundError extends AppError {
  constructor(options?: AppExceptionOptions) {
    super(
      'file://docs/errors.md#event-not-found-error',
      'Not found Error',
      404,
      options,
    );
  }
}

export class EventBadRequestError extends AppError {
  constructor(options?: AppExceptionOptions) {
    super(
      'file://docs/errors.md#event-bad-request-error',
      'Bad request Error',
      400,
      options,
    );
  }
}

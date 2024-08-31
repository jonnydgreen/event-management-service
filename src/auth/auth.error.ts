import { AppError, AppExceptionOptions } from '../errors/error';

export class UnauthorizedError extends AppError {
  constructor(options?: AppExceptionOptions) {
    super(
      'file://docs/errors.md#unauthorized-error',
      'Unauthorized Error',
      401,
      options,
    );
  }
}

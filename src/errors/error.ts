import { HttpException, HttpExceptionOptions } from '@nestjs/common';

// In production, I would implement this differently by defining
// a well-defined interface that is agnostic of the HttpException.
export class AppError extends HttpException {
  readonly type: string;

  constructor(
    type: string,
    response: string | Record<string, any>,
    status: number,
    options?: AppExceptionOptions,
  ) {
    super(response, status, options);
    this.type = type;
  }
}

export type AppExceptionOptions = HttpExceptionOptions;

export class UnprocessableContentError extends AppError {
  constructor(options?: AppExceptionOptions) {
    super(
      'file://docs/errors.md#unprocessable-content-error',
      'Unprocessable Content Error',
      422,
      options,
    );
  }
}

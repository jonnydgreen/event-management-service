import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getUser } from './auth.user';
import { UnauthorizedError } from './auth.error';

// In production, I would refine the shape of this context to be more
// extensible and add instances onto it such as request and a logger
// scopes with a correlation ID for the request
// At the moment, simply returning the user is fine.
export const Ctx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Context => {
    const request = ctx.switchToHttp().getRequest();
    const user = getUser(request);
    return { user };
  },
);

export interface Context {
  user?: string;
}

export function ensureUser(ctx: Context): asserts ctx is Required<Context> {
  if (!ctx.user) {
    throw new UnauthorizedError();
  }
}

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { UnauthorizedError } from './auth.error';
import { getUser } from './auth.user';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = getUser(request);
    if (!!user) {
      return true;
    }
    throw new UnauthorizedError({ cause: 'Invalid authorization token' });
  }
}

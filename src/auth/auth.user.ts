import { Request } from 'express';

export function getUser(request: Request): string | undefined {
  try {
    const token = request
      .header('authorization')
      ?.replace('Bearer ', '')
      ?.trim();
    if (token) {
      const user = Buffer.from(token, 'base64').toString('utf-8');
      if (!!user) {
        return user;
      }
    }
  } catch {
    // Do nothing
  }
}

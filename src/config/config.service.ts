import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  /**
   * The environment of the app. This is configured with the
   * ENVIRONMENT environment variable.
   */
  get environment(): Environment {
    return (
      Environment[this.#getEnvVar<Environment>('ENVIRONMENT')] ||
      Environment.Local
    );
  }

  /**
   * The hold time can be configured with the `MAX_EVENT_SEAT_HOLD_TIME_IN_S`
   * environment variable. See the `docker-compose.yml` file for an example.
   * By default, this is set to 60s.
   */
  get maxEventSeatHoldTimeInS(): number {
    const holdTime = this.#maybeGetEnvVar('MAX_EVENT_SEAT_HOLD_TIME_IN_S');
    // In a production environment, I would perform some extra validation here
    // to ensure that this is a valid integer
    return Number(holdTime || 60);
  }

  /**
   * The redis config of the app. It is configured as follows:
   *  - REDIS_HOST
   *  - REDIS_PORT
   */
  get redis(): RedisConfig {
    const host = this.#getEnvVar('REDIS_HOST');
    const port = this.#getEnvVar('REDIS_PORT');
    return {
      host,
      // In a production environment, I would perform some extra validation here
      // to ensure that this is a valid integer
      port: Number(port),
    };
  }

  #maybeGetEnvVar<T extends string>(key: string): T {
    return process.env[key] as T;
  }

  #getEnvVar<T extends string>(key: string): T {
    const value = process.env[key];
    if (!value) {
      // I'd normally create a custom error here to aid with debugging,
      // automatic logging, and provide a clearer stack trace.
      throw new Error(`No environment variable defined value for key: ${key}`);
    }
    return value as T;
  }
}

// Depending on what environment are available, this can be extending accordingly
export enum Environment {
  Local = 'Local',
}

export interface RedisConfig {
  host: string;
  port: number;
}

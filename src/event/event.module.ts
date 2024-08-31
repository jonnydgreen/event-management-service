import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { ConfigModule } from '../config/config.module';
import { EventService } from './event.service';
import {
  EventRepository,
  EventRepositoryProviderToken,
} from './event.repository';

@Module({
  imports: [ConfigModule],
  providers: [
    EventService,
    {
      provide: EventRepositoryProviderToken,
      useClass: EventRepository,
    },
  ],
  controllers: [EventController],
})
export class EventModule {}

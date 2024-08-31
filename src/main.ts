import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { promises as fs } from 'node:fs';
import { stringify } from 'yaml';
import { AppModule } from './app.module';
import { UnprocessableContentError } from './errors/error';
import { ConfigService, Environment } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    // In a production system, I would refine the exception filter further
    // that would transform any validation errors to those defined by the OpenAPI spec.
    new ValidationPipe({
      exceptionFactory(errors) {
        return new UnprocessableContentError({
          cause: String(
            errors.flatMap((e) => Object.values(e.constraints ?? {})),
          ),
        });
      },
    }),
  );

  const configService = app.get(ConfigService);
  if (configService.environment === Environment.Local) {
    const docConfig = new DocumentBuilder()
      .setTitle('Event Management Service')
      .setDescription(
        'The Event Management Service provides the means to manage all things to do with Events and Seats for specified Events.',
      )
      .setVersion('1.0.0')
      .addTag('Event', 'An Event.')
      .addTag('Seat', 'The Seat associated with an Event.')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, docConfig);
    // Needed to better set the order of the generated YAML file
    const content = stringify({
      openapi: document.openapi,
      info: document.info,
      servers: document.servers,
      tags: document.tags,
      paths: document.paths,
      components: document.components,
    });
    await fs.writeFile('openapi.yaml', content);
  }
  await await app.listen(3000);
}
bootstrap();

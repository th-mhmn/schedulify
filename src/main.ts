import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { GlobalExceptionFilter } from './_core/filters/global-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  //* Helmet
  app.use(helmet());

  //* enable trust proxy
  app.set('trust proxy', 'loopback');

  // * Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5000'],
    credentials: true,
  });

  // * Pino Logger
  app.useLogger(app.get(Logger));

  // * Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // enables class-transformer
      whitelist: true, // strips properties not in DTO
      forbidNonWhitelisted: true, // throws error on extra props
    }),
  );

  // * Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // * App Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
    defaultVersion: '1',
  });

  // * Cookie Parser
  app.use(cookieParser());

  // * Starts listening for shutdown hooks
  app.enableShutdownHooks();

  //* Swagger
  const config = new DocumentBuilder()
    .setTitle('Schedulify')
    .setDescription(' API description')
    .setVersion('1.0')
    .addCookieAuth('Authentication', {
      type: 'apiKey',
      in: 'cookie',
      name: 'Authentication',
    })
    .addCookieAuth('Refresh', {
      type: 'apiKey',
      in: 'cookie',
      name: 'Refresh',
    })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();

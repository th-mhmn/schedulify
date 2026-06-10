import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './_core/filters/global-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // * Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5000'],
    credentials: true,
  });

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

  //* Helmet
  app.use(helmet());

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './observability/global-exception.filter';

async function bootstrap() {
  dotenv.config();
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('Invalid PORT. Set PORT in .env (example: PORT=3000).');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'Missing DATABASE_URL. Set DATABASE_URL in .env before starting the app.',
    );
  }

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(app.get(GlobalExceptionFilter));
  await app.listen(port);
}
bootstrap();

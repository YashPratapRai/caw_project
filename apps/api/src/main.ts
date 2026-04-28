import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

async function bootstrap() {
  dotenv.config();

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('Invalid PORT. Set PORT in .env (example: PORT=3000).');
  }

  const app = await NestFactory.create(AppModule);
  await app.listen(port);
}
bootstrap();

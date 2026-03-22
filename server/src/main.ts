import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  // Enable CORS
  app.enableCors();

  const port = process.env.PORT || 5000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Nest auth server listening on http://localhost:${port}`);
}

bootstrap();


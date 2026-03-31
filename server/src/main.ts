import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { json, urlencoded } = require('express');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Increase body size limit for large chat histories
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const port = process.env.PORT || 5000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Nest auth server listening on http://localhost:${port}`);
}

bootstrap();


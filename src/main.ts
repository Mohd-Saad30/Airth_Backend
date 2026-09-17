import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(
    {
      origin:"*",
      methods:["GET","POST","PATCH","DELETE","OPTIONS"],
      allowedHeaders:["Content-Type","Authorization"],
      credentials: true
    }
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

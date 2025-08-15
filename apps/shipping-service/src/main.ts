import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`Shipping Service is running on port ${port}`);
}

bootstrap();

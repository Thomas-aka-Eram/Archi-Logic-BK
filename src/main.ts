import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: 'http://localhost:8080', // Default Vite dev server port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.use(
    bodyParser.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

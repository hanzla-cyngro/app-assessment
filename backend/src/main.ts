import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Incident Command Center API')
    .setDescription('Incident management, analytics, and evidence attachment endpoints.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, { customSiteTitle: 'Incident Command Center API' });

  app.enableCors({
    origin: (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000').split(',').map((x) => x.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
void bootstrap();

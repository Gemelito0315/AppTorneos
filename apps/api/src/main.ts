import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Límite de carga para fotos en Base64
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));

  // 2. Cabeceras de seguridad
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permitir Swagger UI
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. CORS
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin === '*' ? true : [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 3. Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Manejador global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. OpenAPI / Swagger en /docs
  const config = new DocumentBuilder()
    .setTitle('Plataforma Billar Pro - API')
    .setDescription(
      'API REST para la gestión integral de campeonatos de billar (Carambola, Pool, Libre), clubes y sorteos verificables.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su token de acceso Bearer JWT',
        in: 'header',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Documentación API - Plataforma de Billar',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 API de Billar corriendo en: http://localhost:${port}`);
  logger.log(`📚 Documentación Swagger disponible en: http://localhost:${port}/docs`);
}

bootstrap();

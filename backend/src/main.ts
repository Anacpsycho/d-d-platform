import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - Allow requests from nginx proxy and frontend
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'];
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('D&D 5E Character Sheet API')
    .setDescription('API for managing D&D 5th Edition character sheets, campaigns, and game sessions')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('characters', 'Character sheet management')
    .addTag('campaigns', 'Campaign management')
    .addTag('sessions', 'Game session management')
    .addTag('combat', 'Combat encounter management')
    .addTag('events', 'Game event tracking')
    .addTag('messaging', 'In-game messaging')
    .addTag('npcs', 'NPC management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Global validation pipe
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

  // API prefix (excludes /health endpoint)
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api-docs`);
  console.log(` Health check available at: http://localhost:${port}/health`);
  console.log(`🔧 CORS enabled for: ${corsOrigins.join(', ')}`);
}

bootstrap();

// Made with Bob

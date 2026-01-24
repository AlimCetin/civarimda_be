import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import * as express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppLoggerService } from './common/logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // Disable default body parser to configure custom limits
  });


  // Uploads klasörünü statik olarak sun
  // http://localhost:3000/uploads/videos/xxx.mp4 adresinden erişilebilir olacak
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const configService = app.get(ConfigService);
  const logger = app.get(AppLoggerService);

  // Configure body parser with increased limits (must be done before other middleware)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Use Winston logger for exception filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Güvenlik Headers - Helmet
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        mediaSrc: ["'self'", 'https:', 'data:', 'blob:'],
      },
    },
  }));

  // Compression
  app.use(compression());

  // CORS Configuration
  const corsOrigins = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000,http://localhost:19006,http://10.0.2.2:3000').split(',');
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Request Size Limits (additional check, body parser handles the actual limit)
  app.use((req, res, next) => {
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 50 * 1024 * 1024) {
      return res.status(413).json({ message: 'Request entity too large' });
    }
    next();
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Backend is running on: http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`🔒 Security features enabled: Helmet, CORS, Rate Limiting, Validation, Winston Logging`, 'Bootstrap');
}
bootstrap();

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
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:8081',
    'http://10.0.2.2:3000',
    'https://civarimda.onrender.com',
  ];
  const configuredOrigins = configService.get<string>('CORS_ORIGIN', '')
    ? configService.get<string>('CORS_ORIGIN', '').split(',').map((o) => o.trim())
    : [];
  const allowedOrigins = [...defaultOrigins, ...configuredOrigins];

  app.enableCors({
    origin: (origin, callback) => {
      // 1. Mobil uygulamalar (React Native / Android / iOS) ve servis içi istekler:
      // Tarayıcı olmadıkları için ya origin göndermezler ya da 'null' / 'file://' gönderirler.
      if (!origin || origin === 'null' || origin.startsWith('file://')) {
        return callback(null, true);
      }

      // 2. İzinli web alan adları (Development ve Production web siteleri):
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Yabancı web sitelerinden gelen tarayıcı isteklerini standart olarak reddet
      // (Sunucuyu 500 ile çökertmek yerine tarayıcı standartı olan false dönülür)
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
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

  // Health check endpoints (hem /health hem /api/health isteklerini destekle)
  app.use(['/health', '/api/health'], (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return res.status(200).json({ status: 'OK', message: 'Civarımda API is running' });
    }
    next();
  });

  app.setGlobalPrefix('api', {
    exclude: ['/', '/health', 'health'],
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Backend is running on: http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`🔒 Security features enabled: Helmet, CORS, Rate Limiting, Validation, Winston Logging`, 'Bootstrap');
}
bootstrap();

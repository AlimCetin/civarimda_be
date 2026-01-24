import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { AdsModule } from './ads/ads.module';
import { AppController } from './app.controller';
import { AppLoggerService } from './common/logger/logger.service';
import { RedisModule } from './common/redis/redis.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers:[{
        ttl: configService.get<number>('THROTTLE_TTL', 60),
        limit: configService.get<number>('THROTTLE_LIMIT', 100),  
        }],
      }),
    }),
    RedisModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PostsModule,
    MessagesModule,
    NotificationsModule,
    ReportsModule,
    AdminModule,
    AdsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppLoggerService,
  ],
  exports: [AppLoggerService],
})
export class AppModule {}

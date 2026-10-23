import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const DatabaseModule = TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('TYPEORM_SYNC', true), // auto create tables in development / when requested
        ssl: isProduction && configService.get<string>('POSTGRES_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        extra: {
          max: configService.get<number>('POSTGRES_MAX_POOL_SIZE', isProduction ? 30 : 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      };
    }

    return {
      type: 'postgres',
      host: configService.get<string>('POSTGRES_HOST', 'localhost'),
      port: configService.get<number>('POSTGRES_PORT', 5432),
      username: configService.get<string>('POSTGRES_USERNAME', 'postgres'),
      password: configService.get<string>('POSTGRES_PASSWORD', 'postgres'),
      database: configService.get<string>('POSTGRES_DATABASE', 'civarimda'),
      autoLoadEntities: true,
      synchronize: configService.get<boolean>('TYPEORM_SYNC', true),
      ssl: isProduction && configService.get<string>('POSTGRES_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      extra: {
        max: configService.get<number>('POSTGRES_MAX_POOL_SIZE', isProduction ? 30 : 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
    };
  },
});

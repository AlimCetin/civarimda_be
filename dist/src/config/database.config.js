"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
exports.DatabaseModule = typeorm_1.TypeOrmModule.forRootAsync({
    inject: [config_1.ConfigService],
    useFactory: (configService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const databaseUrl = configService.get('DATABASE_URL');
        if (databaseUrl) {
            return {
                type: 'postgres',
                url: databaseUrl,
                autoLoadEntities: true,
                synchronize: configService.get('TYPEORM_SYNC', true),
                ssl: isProduction && configService.get('POSTGRES_SSL') === 'true' ? { rejectUnauthorized: false } : false,
                extra: {
                    max: configService.get('POSTGRES_MAX_POOL_SIZE', isProduction ? 30 : 10),
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 5000,
                },
            };
        }
        return {
            type: 'postgres',
            host: configService.get('POSTGRES_HOST', 'localhost'),
            port: configService.get('POSTGRES_PORT', 5432),
            username: configService.get('POSTGRES_USERNAME', 'postgres'),
            password: configService.get('POSTGRES_PASSWORD', 'postgres'),
            database: configService.get('POSTGRES_DATABASE', 'civarimda'),
            autoLoadEntities: true,
            synchronize: configService.get('TYPEORM_SYNC', true),
            ssl: isProduction && configService.get('POSTGRES_SSL') === 'true' ? { rejectUnauthorized: false } : false,
            extra: {
                max: configService.get('POSTGRES_MAX_POOL_SIZE', isProduction ? 30 : 10),
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
            },
        };
    },
});
//# sourceMappingURL=database.config.js.map
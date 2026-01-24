"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
exports.DatabaseModule = mongoose_1.MongooseModule.forRootAsync({
    inject: [config_1.ConfigService],
    useFactory: (configService) => {
        const uri = configService.get('MONGODB_URI');
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is required');
        }
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
            uri,
            maxPoolSize: configService.get('MONGODB_MAX_POOL_SIZE', isProduction ? 50 : 10),
            minPoolSize: configService.get('MONGODB_MIN_POOL_SIZE', isProduction ? 10 : 2),
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 10000,
            maxIdleTimeMS: 60000,
            retryWrites: true,
            retryReads: true,
            monitorCommands: !isProduction,
        };
    },
});
//# sourceMappingURL=database.config.js.map
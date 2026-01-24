import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

export const DatabaseModule = MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const uri = configService.get<string>('MONGODB_URI');
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    // Connection pooling optimization
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    
    return {
      uri,
      // Connection pool settings
      maxPoolSize: configService.get<number>('MONGODB_MAX_POOL_SIZE', isProduction ? 50 : 10),
      minPoolSize: configService.get<number>('MONGODB_MIN_POOL_SIZE', isProduction ? 10 : 2),
      
      // Connection timeout settings
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 10000, // 10 seconds
      
      // Keep-alive settings for long-running connections
      heartbeatFrequencyMS: 10000, // 10 seconds
      
      // Automatically close connections that have been idle
      maxIdleTimeMS: 60000, // 1 minute
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Connection monitoring
      monitorCommands: !isProduction, // Only in development
    };
  },
});

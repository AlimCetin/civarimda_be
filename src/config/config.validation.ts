// Simple validation without Joi - using class-validator approach
// For production, consider using @nestjs/config with Joi or class-validator

export function validateConfig(config: Record<string, unknown>) {
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!config[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const jwtSecret = config.JWT_SECRET as string;
  if (jwtSecret && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Production'da kesinlikle environment variable olmalı, varsayılan değer kabul edilmez
  if (isProduction) {
    // Production'da zayıf secret kontrolü
    if (jwtSecret === 'secret' || jwtSecret === 'your-secret-key' || jwtSecret.length < 64) {
      throw new Error('JWT_SECRET must be at least 64 characters long in production');
    }
    
    // Production'da MongoDB URI kontrolü
    const mongoUri = config.MONGODB_URI as string;
    if (mongoUri && (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1'))) {
      console.warn('⚠️  WARNING: Using localhost MongoDB URI in production is not recommended');
    }
  }

  return config;
}

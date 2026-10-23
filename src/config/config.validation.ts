// Simple validation without Joi - using class-validator approach
// For production, consider using @nestjs/config with Joi or class-validator

export function validateConfig(config: Record<string, unknown>) {
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredEnvVars = ['JWT_SECRET'];
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!config[envVar]) {
      missing.push(envVar);
    }
  }

  // Production ortamında DATABASE_URL veya POSTGRES_HOST olmalıdır
  if (isProduction && !config.DATABASE_URL && !config.POSTGRES_HOST) {
    missing.push('DATABASE_URL');
  }

  if (missing.length > 0) {
    const errorMsg = `
❌ CRITICAL ERROR: Missing required environment variables: ${missing.join(', ')}
💡 FIX: Please set these variables in your deployment environment (e.g., Render Dashboard > Environment).
📚 See ENV_SETUP.md for details.
    `.trim();
    throw new Error(errorMsg);
  }

  const jwtSecret = config.JWT_SECRET as string;
  if (jwtSecret && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Production'da zayıf secret kontrolü
  if (isProduction) {
    if (jwtSecret === 'secret' || jwtSecret === 'your-secret-key') {
      throw new Error('JWT_SECRET is too weak for production');
    }
  }

  return config;
}


"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
function validateConfig(config) {
    const isProduction = process.env.NODE_ENV === 'production';
    const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
    const missing = [];
    for (const envVar of requiredEnvVars) {
        if (!config[envVar]) {
            missing.push(envVar);
        }
    }
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    const jwtSecret = config.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    if (isProduction) {
        if (jwtSecret === 'secret' || jwtSecret === 'your-secret-key' || jwtSecret.length < 64) {
            throw new Error('JWT_SECRET must be at least 64 characters long in production');
        }
        const mongoUri = config.MONGODB_URI;
        if (mongoUri && (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1'))) {
            console.warn('⚠️  WARNING: Using localhost MongoDB URI in production is not recommended');
        }
    }
    return config;
}
//# sourceMappingURL=config.validation.js.map
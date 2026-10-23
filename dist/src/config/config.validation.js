"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
function validateConfig(config) {
    const isProduction = process.env.NODE_ENV === 'production';
    const requiredEnvVars = ['JWT_SECRET'];
    const missing = [];
    for (const envVar of requiredEnvVars) {
        if (!config[envVar]) {
            missing.push(envVar);
        }
    }
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
    const jwtSecret = config.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    if (isProduction) {
        if (jwtSecret === 'secret' || jwtSecret === 'your-secret-key') {
            throw new Error('JWT_SECRET is too weak for production');
        }
    }
    return config;
}
//# sourceMappingURL=config.validation.js.map
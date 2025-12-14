import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvConfig {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    redisHost: string;
    redisPort: number;
    redisPassword?: string;
    corsOrigin: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Development defaults (warn but allow)
const devDefaults = {
    DATABASE_URL: 'postgresql://postgres:29Vlach92%40%28%21%40@localhost:5432/nodejstest',
    JWT_SECRET: 'dev-secret-key-change-in-production-min-32-chars',
};

// Check for required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
] as const;

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// In production, require all environment variables
if (isProduction && missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables in production: ${missingEnvVars.join(', ')}\n` +
        'Please check your .env file or environment configuration.'
    );
}

// In development, warn about missing variables but use defaults
if (!isProduction && missingEnvVars.length > 0) {
    console.warn(
        `⚠️  Warning: Missing environment variables: ${missingEnvVars.join(', ')}\n` +
        `Using development defaults. For production, please set these in your .env file.\n`
    );
}

// Validate JWT_SECRET strength in production
if (isProduction) {
    const jwtSecret = process.env.JWT_SECRET || '';
    if (jwtSecret.length < 32) {
        throw new Error(
            'JWT_SECRET must be at least 32 characters long in production environment'
        );
    }
    if (jwtSecret === 'your-secret-key' || 
        jwtSecret === 'your-super-secret-jwt-key-change-this-in-production' ||
        jwtSecret === devDefaults.JWT_SECRET) {
        throw new Error(
            'JWT_SECRET must be changed from the default value in production'
        );
    }
}

export const env: EnvConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: nodeEnv,
    databaseUrl: process.env.DATABASE_URL || devDefaults.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET || devDefaults.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    redisPassword: process.env.REDIS_PASSWORD,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

export default env;


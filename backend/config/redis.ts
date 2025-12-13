import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Ensure `maxRetriesPerRequest` is `null` as required by BullMQ for blocking
// commands (see BullMQ RedisConnection.checkBlockingOptions).
const redisOptions = {
    maxRetriesPerRequest: null as unknown as number | null,
};

export const redis = new Redis(redisUrl, redisOptions);

redis.on('connect', () => {
    logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
    // logger.error accepts a single string message; include the error details in the string
    logger.error(`Redis connection error: ${err instanceof Error ? err.stack || err.message : String(err)}`);
});

import { env } from '../config/env';

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    metadata?: Record<string, unknown>;
    error?: Error;
}

class Logger {
    private formatMessage(level: LogLevel, message: string, metadata?: Record<string, unknown>, error?: Error): string {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(metadata && { metadata }),
            ...(error && { 
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            })
        };

        // In development, use pretty formatting
        if (env.nodeEnv === 'development') {
            const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
            return `${prefix} ${message}${metadata ? ` ${JSON.stringify(metadata)}` : ''}${error ? `\n${error.stack}` : ''}`;
        }

        // In production, use JSON format for log aggregation
        return JSON.stringify(entry);
    }

    info(message: string, metadata?: Record<string, unknown>): void {
        console.log(this.formatMessage('info', message, metadata));
    }

    error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
        console.error(this.formatMessage('error', message, metadata, error));
    }

    warn(message: string, metadata?: Record<string, unknown>): void {
        console.warn(this.formatMessage('warn', message, metadata));
    }

    debug(message: string, metadata?: Record<string, unknown>): void {
        if (env.nodeEnv === 'development') {
            console.debug(this.formatMessage('debug', message, metadata));
        }
    }
}

export const logger = new Logger();

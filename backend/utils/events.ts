import { EventEmitter } from 'events';
import { logger } from './logger';

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.on('error', (error) => {
            logger.error(`EventBus error: ${error instanceof Error ? error.stack || error.message : String(error)}`);
        });
    }

    emit(event: string | symbol, ...args: any[]): boolean {
        logger.info(`Event Emitted: ${String(event)}`);
        return super.emit(event, ...args);
    }
}

export const eventBus = new EventBus();

export const EVENTS = {
    PROJECT: {
        CREATED: 'project:created',
        UPDATED: 'project:updated',
        DELETED: 'project:deleted',
    },
    TASK: {
        CREATED: 'task:created',
        UPDATED: 'task:updated',
        DELETED: 'task:deleted',
    },
    NOTIFICATION: {
        CREATED: 'notification:created',
    }
};

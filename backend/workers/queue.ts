import amqp, { ConsumeMessage } from 'amqplib';
import { logger } from '../utils/logger';

const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

let conn: any = null;
let channel: any = null;

async function ensureConnection() {
    if (conn && channel) return { conn, channel };
    conn = await amqp.connect(RABBIT_URL);
    channel = await conn.createChannel();
    return { conn, channel };
}

export async function enqueueNotification(message: any) {
    const { channel } = await ensureConnection();
    const queue = 'notifications';
    await channel!.assertQueue(queue, { durable: true });
    channel!.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
}

export async function enqueueReport(message: any) {
    const { channel } = await ensureConnection();
    const queue = 'reports';
    await channel!.assertQueue(queue, { durable: true });
    channel!.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
}

async function handleNotification(msg: ConsumeMessage | null) {
    if (!msg) return;
    try {
        const job = JSON.parse(msg.content.toString());
        logger.info(`Processing notification job: ${job?.id ?? '[no-id]'}`);
        // Simulate work
        await new Promise((r) => setTimeout(r, 1000));
        logger.info(`Notification processed: ${job?.id ?? '[no-id]'}`);
        channel!.ack(msg);
    } catch (err: any) {
        logger.error(`Notification worker error: ${err?.message ?? String(err)}`);
        channel!.nack(msg, false, false);
    }
}

async function handleReport(msg: ConsumeMessage | null) {
    if (!msg) return;
    try {
        const job = JSON.parse(msg.content.toString());
        logger.info(`Generating report for tenant ${job?.tenantId ?? '[unknown]'}`);
        // Simulate heavy work
        await new Promise((r) => setTimeout(r, 3000));
        logger.info(`Report generated for tenant ${job?.tenantId ?? '[unknown]'}`);
        channel!.ack(msg);
    } catch (err: any) {
        logger.error(`Report worker error: ${err?.message ?? String(err)}`);
        channel!.nack(msg, false, false);
    }
}

export async function initQueues() {
    const { channel } = await ensureConnection();
    await channel!.assertQueue('notifications', { durable: true });
    await channel!.assertQueue('reports', { durable: true });

    // Start consumers
    await channel!.consume('notifications', handleNotification, { noAck: false });
    await channel!.consume('reports', handleReport, { noAck: false });

    logger.info('RabbitMQ queues and consumers initialized');
}

export async function shutdownQueues() {
    try {
        await channel?.close();
        await (conn as any)?.close();
    } catch (e) {
        // ignore
    }
    channel = null;
    conn = null;
}

// Backwards-compatible exports for code that expects functions/queues
export const notificationQueue = { add: (msg: any) => enqueueNotification(msg) };
export const reportQueue = { add: (msg: any) => enqueueReport(msg) };

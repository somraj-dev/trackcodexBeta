import { PrismaClient } from '@prisma/client';
import { Kafka, logLevel } from 'kafkajs';

const prisma = new PrismaClient();
const KAFKA_BROKER_URL = process.env.KAFKA_BROKER_URL || 'localhost:9092';

const kafka = new Kafka({
    clientId: 'trackcodex-outbox-worker',
    brokers: [KAFKA_BROKER_URL],
    logLevel: logLevel.ERROR,
});

const producer = kafka.producer();

/**
 * The Outbox Worker polls the OutboxEvent table for unprocessed events,
 * publishes them to Kafka, and then marks them as processed.
 */
export async function startOutboxWorker() {
    try {
        await producer.connect();
        console.log(`[Outbox Worker] Connected to Kafka Broker at ${KAFKA_BROKER_URL}`);

        // Poll every 5 seconds
        setInterval(async () => {
            try {
                await processOutboxEvents();
            } catch (err) {
                console.error('[Outbox Worker] Error during polling cycle:', err);
            }
        }, 5000);

    } catch (error) {
        console.error('[Outbox Worker] Fatal error connecting to Kafka:', error);
    }
}

async function processOutboxEvents() {
    // Grab up to 50 unprocessed events at a time to prevent memory bloat
    const events = await prisma.outboxEvent.findMany({
        where: { processed: false },
        take: 50,
        orderBy: { createdAt: 'asc' }
    });

    if (events.length === 0) return;

    console.log(`[Outbox Worker] Processing ${events.length} new events...`);

    for (const event of events) {
        try {
            // 1. Send to Kafka. 
            //    We use the "topic" column from the DB as the Kafka topic name.
            await producer.send({
                topic: event.topic,
                messages: [
                    { value: JSON.stringify(event.payload) }
                ],
            });

            // 2. Mark as processed in the database
            await prisma.outboxEvent.update({
                where: { id: event.id },
                data: {
                    processed: true,
                    processedAt: new Date()
                }
            });

        } catch (err: any) {
            console.error(`[Outbox Worker] Failed to process event ${event.id}:`, err);
            // Mark as error so we can debug it later, but don't stop processing other events
            await prisma.outboxEvent.update({
                where: { id: event.id },
                data: { error: err.message || 'Unknown error during Kafka publish' }
            });
        }
    }
}

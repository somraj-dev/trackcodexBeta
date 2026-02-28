import { PrismaClient } from '@prisma/client';
import { Client } from '@elastic/elasticsearch';

const prisma = new PrismaClient();
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://10.12.209.110:9200';

const esClient = new Client({
    node: ELASTICSEARCH_URL,
    headers: {
        'Bypass-Tunnel-Reminder': 'true',
        'User-Agent': 'trackcodex-backend'
    }
});

/**
 * The Outbox Worker polls the OutboxEvent table for unprocessed events,
 * and inserts them directly into Elasticsearch.
 */
export async function startOutboxWorker() {
    console.log(`[Outbox Worker] Starting ES-only outbox worker. Target: ${ELASTICSEARCH_URL}`);

    // Poll every 5 seconds
    setInterval(async () => {
        try {
            await processOutboxEvents();
        } catch (err) {
            console.error('[Outbox Worker] Error during polling cycle:', err);
        }
    }, 5000);
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
            // 1. Send to Elasticsearch directly
            // Extract the table name from the topic (e.g. server1.public.users)
            const indexName = event.topic;

            // Format ID for ES if needed, assuming payload has an id
            const payload = event.payload as any;
            if (payload && payload.id) {
                await esClient.index({
                    index: indexName,
                    id: payload.id.toString(), // Use DB ID as document ID for upserts
                    body: {
                        payload: payload,
                        eventType: event.eventType,
                        timestamp: event.createdAt
                    }
                });
            } else {
                await esClient.index({
                    index: indexName,
                    body: {
                        payload: payload,
                        eventType: event.eventType,
                        timestamp: event.createdAt
                    }
                });
            }

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

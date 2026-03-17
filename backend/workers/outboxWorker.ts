import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'https://bumpy-snakes-guess.loca.lt';

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
            if (event.topic !== "UPDATE_USER_COUNTERS") {
                const indexName = event.topic;
                const payload = event.payload as any;
                const esHeaders = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true',
                    'User-Agent': 'trackcodex-backend'
                };

                let esRes;
                if (payload && payload.id) {
                    esRes = await fetch(`${ELASTICSEARCH_URL}/${indexName}/_doc/${payload.id.toString()}`, {
                        method: 'PUT',
                        headers: esHeaders,
                        body: JSON.stringify({
                            payload: payload,
                            eventType: event.topic,
                            timestamp: event.createdAt
                        })
                    });
                } else {
                    esRes = await fetch(`${ELASTICSEARCH_URL}/${indexName}/_doc`, {
                        method: 'POST',
                        headers: esHeaders,
                        body: JSON.stringify({
                            payload: payload,
                            eventType: event.topic,
                            timestamp: event.createdAt
                        })
                    });
                }

                if (!esRes.ok) {
                    const text = await esRes.text();
                    throw new Error(`Elasticsearch error ${esRes.status}: ${text}`);
                }
            } else {
                // 1b. Handle User Counter Updates
                const { userId, followersChange, followingChange } = event.payload as any;
                await prisma.profile.update({
                    where: { userId },
                    data: {
                        followersCount: followersChange ? { increment: followersChange } : undefined,
                        followingCount: followingChange ? { increment: followingChange } : undefined,
                    }
                });
                console.log(`[Outbox Worker] Updated counters for user ${userId}: followers+=(${followersChange}), following+=(${followingChange})`);
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
                data: { 
                    error: err.message || 'Unknown error during ES publish',
                    // Set processed to true so we don't infinitely block the queue on one poisoned event
                    processed: true 
                }
            });
        }
    }
}




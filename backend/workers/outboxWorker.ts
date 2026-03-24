import { PrismaClient } from '@prisma/client';
import { indexDocuments } from '../services/infra/meilisearch';

const prisma = new PrismaClient();

/**
 * The Outbox Worker polls the OutboxEvent table for unprocessed events,
 * and inserts them into Meilisearch for real-time search indexing.
 */
export async function startOutboxWorker() {
    console.log(`[Outbox Worker] Starting Meilisearch outbox worker.`);

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
            // 1. Send to Meilisearch
            if (event.topic !== "UPDATE_USER_COUNTERS") {
                const indexName = event.topic;
                const payload = event.payload as any;

                if (payload && payload.id) {
                    await indexDocuments(indexName, payload);
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
                    error: err.message || 'Unknown error during Meilisearch publish',
                    // Set processed to true so we don't infinitely block the queue on one poisoned event
                    processed: true 
                }
            });
        }
    }
}

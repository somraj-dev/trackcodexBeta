import { Kafka, logLevel } from 'kafkajs';
import { indexDocument, deleteDocument, ensureIndexExists } from './elasticsearch';

const KAFKA_BROKER_URL = process.env.KAFKA_BROKER_URL || 'localhost:9092';

// 1. Initialize Kafka Client
const kafka = new Kafka({
    clientId: 'trackcodex-cdc',
    brokers: [KAFKA_BROKER_URL],
    logLevel: logLevel.ERROR,
});

const consumer = kafka.consumer({ groupId: 'elasticsearch-indexer-group' });

// 2. Define the exact DB tables we want to listen to (must match docker connector config)
// Format: "serverName.schemaName.tableName"
const TOPICS = [
    'trackcodex-db.public.Activity',
    'trackcodex-db.public.CodeScan',
    'trackcodex-db.public.Vulnerability'
];

/**
 * Parses the verbose Debezium JSON payload to extract the actual database row.
 */
function extractRowData(messageValue: Buffer | null): { op: string, before: any, after: any } | null {
    if (!messageValue) return null;
    try {
        const parsed = JSON.parse(messageValue.toString());

        // Debezium wraps the actual row changes in a "payload" object
        const payload = parsed.payload;
        if (!payload) return null;

        // op: 'c' (create), 'u' (update), 'd' (delete), 'r' (read/snapshot)
        return {
            op: payload.op,
            before: payload.before,
            after: payload.after,
        };
    } catch (err) {
        console.error('[Kafka Consumer] Failed to parse message value', err);
        return null;
    }
}

/**
 * Starts the Kafka consumer daemon
 */
export async function startKafkaConsumer() {
    try {
        await consumer.connect();
        console.log(`[Kafka Consumer] Connected to broker: ${KAFKA_BROKER_URL}`);

        // Subscribe to all mapped Postgres CDC topics
        for (const topic of TOPICS) {
            await consumer.subscribe({ topic, fromBeginning: true });

            // Auto-create ES indices corresponding to table names to prevent mapping errors on first insert
            const indexName = topic.split('.').pop()?.toLowerCase();
            if (indexName) {
                await ensureIndexExists(indexName);
            }
        }

        // Begin processing the event stream
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const indexName = topic.split('.').pop()?.toLowerCase();
                if (!indexName) return;

                const data = extractRowData(message.value);
                if (!data) return;

                const { op, before, after } = data;

                try {
                    // Handle Create, Update, Read (Snapshot) operations
                    if ((op === 'c' || op === 'u' || op === 'r') && after?.id) {
                        await indexDocument(indexName, after.id, after);
                        console.log(`[Elasticsearch] Indexed ${indexName} ID: ${after.id}`);
                    }

                    // Handle Delete operations
                    else if (op === 'd' && before?.id) {
                        await deleteDocument(indexName, before.id);
                        console.log(`[Elasticsearch] Deleted ${indexName} ID: ${before.id}`);
                    }
                } catch (err: any) {
                    console.error(`[Kafka Consumer] Error processing message on topic ${topic}`, err?.message)
                }
            },
        });

    } catch (error) {
        console.error('[Kafka Consumer] Fatal error starting consumer:', error);
        // In production, we should exit the process and let PM2/Docker restart it
        process.exit(1);
    }
}

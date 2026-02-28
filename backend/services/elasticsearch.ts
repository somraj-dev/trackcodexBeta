import { Client } from '@elastic/elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

// Global singleton client to avoid exhausting connections
const globalForElastic = global as unknown as { elasticClient: Client };
export const elasticClient = globalForElastic.elasticClient || new Client({ node: ELASTICSEARCH_URL });

if (process.env.NODE_ENV !== 'production') {
    globalForElastic.elasticClient = elasticClient;
}

/**
 * Ensures a specific index exists in Elasticsearch
 */
export async function ensureIndexExists(indexName: string) {
    try {
        const exists = await elasticClient.indices.exists({ index: indexName });
        if (!exists) {
            await elasticClient.indices.create({ index: indexName });
            console.log(`[Elasticsearch] Index created: ${indexName}`);
        }
    } catch (error) {
        console.error(`[Elasticsearch] Error verifying index ${indexName}:`, error);
    }
}

/**
 * Upserts a document into Elasticsearch
 */
export async function indexDocument(indexName: string, id: string, document: any) {
    try {
        await elasticClient.index({
            index: indexName,
            id: id,
            document: document,
        });
    } catch (error) {
        console.error(`[Elasticsearch] Failed to index document ID ${id} into ${indexName}:`, error);
    }
}

/**
 * Deletes a document from Elasticsearch
 */
export async function deleteDocument(indexName: string, id: string) {
    try {
        await elasticClient.delete({
            index: indexName,
            id: id,
        });
    } catch (error) {
        console.error(`[Elasticsearch] Failed to delete document ID ${id} from ${indexName}:`, error);
    }
}

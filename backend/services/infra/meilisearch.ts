import { MeiliSearch } from 'meilisearch';
import { env } from '../../config/env';

/**
 * Singleton Meilisearch client instance.
 * Connects to the host defined in environment variables.
 */
export const meilisearchClient = new MeiliSearch({
  host: env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: env.MEILISEARCH_ADMIN_KEY || 'masterKey',
});

/**
 * Ensures a given index exists, creates it if not.
 * @param indexUid The unique identifier for the index
 * @param primaryKey The primary key field (defaults to 'id')
 */
export async function ensureIndexExists(indexUid: string, primaryKey: string = 'id') {
  try {
    await meilisearchClient.getIndex(indexUid);
  } catch (error: any) {
    // MeiliSearch SDK wraps the error code in error.cause.code or error.code
    const code = error?.cause?.code || error?.code;
    if (code === 'index_not_found' || error?.httpStatus === 404 || error?.response?.status === 404) {
      console.warn(`[Meilisearch] Creating index: ${indexUid}`);
      await meilisearchClient.createIndex(indexUid, { primaryKey });
      // Wait briefly for the async task to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      throw error;
    }
  }
}

/**
 * Indexes a single document or an array of documents into the specified index.
 * @param indexUid The index to insert into
 * @param documents The document(s) to index
 */
export async function indexDocuments(indexUid: string, documents: any | any[]) {
  const docs = Array.isArray(documents) ? documents : [documents];
  const index = meilisearchClient.index(indexUid);
  await index.addDocuments(docs);
}

/**
 * Executes a search query on the specified index.
 * @param indexUid The index to search in
 * @param query The search string
 * @param options Optional SearchParams for Meilisearch
 */
export async function searchDocuments(indexUid: string, query: string, options: any = {}) {
  const index = meilisearchClient.index(indexUid);
  return index.search(query, options);
}

/**
 * Deletes documents by id.
 * @param indexUid The index to delete from
 * @param documentIds Array of IDs to delete
 */
export async function deleteDocuments(indexUid: string, documentIds: string[]) {
  const index = meilisearchClient.index(indexUid);
  await index.deleteDocuments(documentIds);
}

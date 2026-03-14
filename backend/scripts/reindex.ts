import { prisma } from "../services/infra/prisma";
import { ensureIndexExists, indexDocument } from "../services/infra/elasticsearch";

/**
 * Migration script to perform a full sync from RDS to AWS OpenSearch.
 * Handles Users, Repositories, Jobs, and Workspaces.
 */
async function reindexAll() {
    console.warn("🚀 [Reindex] Starting full OpenSearch synchronization...");

    const entities = [
        {
            name: "users",
            model: prisma.user,
            index: "trackcodex.users",
            fields: { id: true, email: true, username: true, name: true, bio: true, avatar: true, location: true }
        },
        {
            name: "repositories",
            model: prisma.repository,
            index: "trackcodex.repositories",
            fields: { id: true, name: true, description: true, language: true, stars: true }
        },
        {
            name: "jobs",
            model: prisma.job,
            index: "trackcodex.jobs",
            fields: { id: true, title: true, description: true, type: true, budget: true }
        },
        {
            name: "workspaces",
            model: prisma.workspace,
            index: "trackcodex.workspaces",
            fields: { id: true, name: true, description: true, status: true }
        }
    ];

    for (const entity of entities) {
        console.log(`⏳ [Reindex] Syncing ${entity.name}...`);

        // 1. Ensure index exists
        await ensureIndexExists(entity.index);

        // 2. Fetch all from DB
        const records = await (entity.model as any).findMany({
            select: entity.fields
        });

        console.log(`📦 [Reindex] Found ${records.length} ${entity.name}. Indexing...`);

        // 3. Index in batches
        for (const record of records) {
            try {
                // We wrap in a 'payload' object to match the Debezium format expected by searchRoutes.ts
                await indexDocument(entity.index, record.id, { payload: record });
            } catch (err: any) {
                console.error(`❌ [Reindex] Failed to index ${entity.name} ID: ${record.id}`, err.message);
            }
        }

        console.log(`✅ [Reindex] Completed ${entity.name}.`);
    }

    console.log("🏁 [Reindex] Full synchronization complete!");
}

reindexAll()
    .catch(err => {
        console.error("❌ [Reindex] Fatal error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });




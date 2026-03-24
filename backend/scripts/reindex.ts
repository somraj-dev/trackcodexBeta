import { prisma } from "../services/infra/prisma";
import { meilisearchClient, ensureIndexExists, indexDocuments } from "../services/infra/meilisearch";

/**
 * Migration script to perform a full sync from Postgres to Meilisearch.
 * Handles Users, Repositories, Jobs, and Workspaces.
 */
async function reindexAll() {
    console.warn("🚀 [Reindex] Starting full Meilisearch synchronization...");

    // ── Sync Users ──
    console.log(`⏳ [Reindex] Syncing Users...`);
    await ensureIndexExists("trackcodex_users", "id");
    const users = await prisma.user.findMany({
        where: { deletedAt: null, accountLocked: false, isPrivate: false, username: { not: null } },
        select: { id: true, email: true, username: true, name: true, avatar: true, role: true }
    });
    // Configure searchable attributes
    await meilisearchClient.index("trackcodex_users").updateSearchableAttributes(["username", "name", "bio"]);
    await indexDocuments("trackcodex_users", users);
    console.log(`✅ [Reindex] Completed Users (${users.length} indexed).`);

    // ── Sync Repositories ──
    console.log(`⏳ [Reindex] Syncing Repositories...`);
    await ensureIndexExists("trackcodex_repositories", "id");
    const repos = await prisma.repository.findMany({
        select: { id: true, name: true, description: true, language: true, stars: true, visibility: true, owner: { select: { username: true } } }
    });
    await meilisearchClient.index("trackcodex_repositories").updateSearchableAttributes(["name", "description", "owner.username", "language"]);
    await meilisearchClient.index("trackcodex_repositories").updateFilterableAttributes(["visibility"]);
    await indexDocuments("trackcodex_repositories", repos);
    console.log(`✅ [Reindex] Completed Repositories (${repos.length} indexed).`);

    // ── Sync Workspaces ──
    console.log(`⏳ [Reindex] Syncing Workspaces...`);
    await ensureIndexExists("trackcodex_workspaces", "id");
    const workspaces = await prisma.workspace.findMany({
        select: { id: true, name: true, description: true, status: true }
    });
    await meilisearchClient.index("trackcodex_workspaces").updateSearchableAttributes(["name", "description"]);
    await indexDocuments("trackcodex_workspaces", workspaces);
    console.log(`✅ [Reindex] Completed Workspaces (${workspaces.length} indexed).`);

    console.log("🏁 [Reindex] Full Meilisearch synchronization complete!");
}

reindexAll()
    .catch(err => {
        console.error("❌ [Reindex] Fatal error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });




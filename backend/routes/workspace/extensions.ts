/**
 * Extension Registry API Routes
 *
 * Endpoints:
 *   GET    /extensions/search         — Search Open VSX registry
 *   GET    /extensions/popular        — Popular/trending extensions
 *   GET    /extensions/:ns/:name      — Get extension details
 *   GET    /extensions/user/:userId   — User's installed extensions
 *   POST   /extensions/install        — Install extension for user
 *   DELETE /extensions/uninstall      — Uninstall extension
 *   PATCH  /extensions/toggle         — Enable/disable extension
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function extensionRoutes(fastify: FastifyInstance) {
    // ─── GET /extensions/search — Search Open VSX ────────────────
    fastify.get("/extensions/search", async (request: FastifyRequest) => {
        const { query = "", category, offset, size, sortBy, sortOrder } = request.query as {
            query?: string;
            category?: string;
            offset?: string;
            size?: string;
            sortBy?: "relevance" | "downloadCount" | "averageRating" | "timestamp";
            sortOrder?: "asc" | "desc";
        };

        try {
            const { openVSXService } = await import("../services/openvsx/OpenVSXService");
            return await openVSXService.search(query, {
                category,
                offset: offset ? parseInt(offset) : undefined,
                size: size ? parseInt(size) : undefined,
                sortBy,
                sortOrder,
            });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Search failed";
            console.error("Extension search failed:", e);
            return { offset: 0, totalSize: 0, extensions: [], error: message };
        }
    });

    // ─── GET /extensions/popular — Trending extensions ───────────
    fastify.get("/extensions/popular", async () => {
        try {
            const { openVSXService } = await import("../services/openvsx/OpenVSXService");
            return await openVSXService.getPopular(16);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed";
            return { offset: 0, totalSize: 0, extensions: [], error: message };
        }
    });

    // ─── GET /extensions/:ns/:name — Extension detail ────────────
    fastify.get("/extensions/:ns/:name", async (request: FastifyRequest, reply: FastifyReply) => {
        const { ns, name } = request.params as { ns: string; name: string };
        try {
            const { openVSXService } = await import("../services/openvsx/OpenVSXService");
            return await openVSXService.getExtension(ns, name);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Not found";
            return reply.code(404).send({ error: message });
        }
    });

    // ─── GET /extensions/user/:userId — User installed ───────────
    fastify.get("/extensions/user/:userId", async (request: FastifyRequest) => {
        const { userId } = request.params as { userId: string };
        try {
            const { extensionManager } = await import("../services/openvsx/ExtensionManager");
            return await extensionManager.getUserExtensions(userId);
        } catch (e: unknown) {
            console.error("Failed to get user extensions:", e);
            return [];
        }
    });

    // ─── POST /extensions/install — Install for user ─────────────
    fastify.post("/extensions/install", async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId, extensionId, publisher, name, version } = request.body as {
            userId: string;
            extensionId: string;
            publisher: string;
            name: string;
            version: string;
        };

        if (!userId || !extensionId) {
            return reply.code(400).send({ error: "userId and extensionId are required" });
        }

        try {
            const { extensionManager } = await import("../services/openvsx/ExtensionManager");
            const ext = await extensionManager.install(userId, extensionId, publisher || "", name || "", version || "latest");
            return { success: true, extension: ext };
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Install failed";
            return reply.code(500).send({ error: message });
        }
    });

    // ─── DELETE /extensions/uninstall — Remove extension ─────────
    fastify.delete("/extensions/uninstall", async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId, extensionId } = request.body as {
            userId: string;
            extensionId: string;
        };

        if (!userId || !extensionId) {
            return reply.code(400).send({ error: "userId and extensionId are required" });
        }

        try {
            const { extensionManager } = await import("../services/openvsx/ExtensionManager");
            await extensionManager.uninstall(userId, extensionId);
            return { success: true };
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Uninstall failed";
            return reply.code(500).send({ error: message });
        }
    });

    // ─── PATCH /extensions/toggle — Enable/disable ───────────────
    fastify.patch("/extensions/toggle", async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId, extensionId, enabled } = request.body as {
            userId: string;
            extensionId: string;
            enabled: boolean;
        };

        if (!userId || !extensionId || enabled === undefined) {
            return reply.code(400).send({ error: "userId, extensionId, and enabled are required" });
        }

        try {
            const { extensionManager } = await import("../services/openvsx/ExtensionManager");
            const ext = await extensionManager.toggle(userId, extensionId, enabled);
            return { success: true, extension: ext };
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Toggle failed";
            return reply.code(500).send({ error: message });
        }
    });
}

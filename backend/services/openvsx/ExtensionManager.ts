/**
 * Extension Manager
 *
 * Manages per-user extension install/uninstall/enable/disable state.
 * Persists to UserExtension table.
 */
import { prisma } from "../prisma";

// Shared prisma instance

export class ExtensionManager {
    /**
     * Install an extension for a user.
     */
    async install(
        userId: string,
        extensionId: string,
        publisher: string,
        name: string,
        version: string
    ) {
        return prisma.userExtension.upsert({
            where: { userId_extensionId: { userId, extensionId } },
            create: {
                userId,
                extensionId,
                publisher,
                name,
                version,
                enabled: true,
            },
            update: {
                version,
                enabled: true,
                installedAt: new Date(),
            },
        });
    }

    /**
     * Uninstall an extension for a user.
     */
    async uninstall(userId: string, extensionId: string) {
        try {
            return await prisma.userExtension.delete({
                where: { userId_extensionId: { userId, extensionId } },
            });
        } catch {
            return null; // Already uninstalled
        }
    }

    /**
     * Enable or disable an extension.
     */
    async toggle(userId: string, extensionId: string, enabled: boolean) {
        return prisma.userExtension.update({
            where: { userId_extensionId: { userId, extensionId } },
            data: { enabled },
        });
    }

    /**
     * Get all installed extensions for a user.
     */
    async getUserExtensions(userId: string) {
        return prisma.userExtension.findMany({
            where: { userId },
            orderBy: { installedAt: "desc" },
        });
    }

    /**
     * Check if an extension is installed for a user.
     */
    async isInstalled(userId: string, extensionId: string): Promise<boolean> {
        const ext = await prisma.userExtension.findUnique({
            where: { userId_extensionId: { userId, extensionId } },
        });
        return ext !== null;
    }

    /**
     * Update last-used timestamp.
     */
    async markUsed(userId: string, extensionId: string) {
        try {
            await prisma.userExtension.update({
                where: { userId_extensionId: { userId, extensionId } },
                data: { lastUsed: new Date() },
            });
        } catch {
            // Extension not installed, ignore
        }
    }

    /**
     * Get install counts across all users for given extensions.
     */
    async getInstallCounts(extensionIds: string[]): Promise<Record<string, number>> {
        const counts = await prisma.userExtension.groupBy({
            by: ["extensionId"],
            where: { extensionId: { in: extensionIds } },
            _count: { extensionId: true },
        });

        const result: Record<string, number> = {};
        for (const c of counts) {
            result[c.extensionId] = c._count.extensionId;
        }
        return result;
    }
}

export const extensionManager = new ExtensionManager();

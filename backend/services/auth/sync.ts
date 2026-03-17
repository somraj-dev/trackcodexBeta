import { prisma } from "../infra/prisma";
import { firebaseAdmin } from "../infra/firebase";

export interface SyncUserData {
  uid: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
}

/**
 * Synchronizes a Firebase user with the PostgreSQL database.
 * Handles conflicts, ensures profile existence, and emits events.
 */
export async function syncUserWithPostgres(userData: SyncUserData) {
  const { uid, email, displayName, avatarUrl } = userData;

  try {
    // 1. Check if user already exists
    let user = await prisma.user.findUnique({
      where: { id: uid },
      include: { profile: true }
    });

    if (user) {
      // Update emailVerified if provided and different
      if (userData.emailVerified !== undefined && user.emailVerified !== userData.emailVerified) {
        await prisma.user.update({
          where: { id: uid },
          data: { emailVerified: userData.emailVerified }
        });
        user.emailVerified = userData.emailVerified;
      }

      // User exists, just ensure profile exists
      if (!user.profile) {
        await prisma.profile.create({
          data: { userId: uid }
        }).catch(() => { /* Already exists, ignore */ });
      }
      return user;
    }

    // 2. User doesn't exist, handle creation with conflict resolution
    let finalUsername = email ? email.split("@")[0] : `user_${uid.substring(0, 8)}`;
    const finalEmail = email || `no-email-${uid}@trackcodex.dev`;
    const finalName = displayName || "TrackCodex User";

    // Standardize username (only alphanumeric, underscores, hyphens)
    finalUsername = finalUsername.replace(/[^a-zA-Z0-9_-]/g, "");

    // Check for username conflicts
    let conflict = await prisma.user.findUnique({ where: { username: finalUsername } });
    if (conflict) {
      finalUsername = `${finalUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. Create User and Profile in a transaction
    const [newUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          id: uid,
          email: finalEmail,
          username: finalUsername,
          name: finalName,
          avatar: avatarUrl,
          password: "", // Managed by Firebase
          role: "user",
          emailVerified: userData.emailVerified || false,
          profile: {
            create: {} // Create empty profile
          }
        },
        include: { profile: true }
      }),
      prisma.outboxEvent.create({
        data: {
          topic: "user",
          payload: {
            id: uid,
            email: finalEmail,
            username: finalUsername,
            name: finalName,
            role: "user"
          }
        }
      })
    ]);

    console.log(`[SYNC-SERVICE] Created new user: ${finalUsername} (${uid})`);
    return newUser;

  } catch (error: any) {
    console.error(`[SYNC-SERVICE] Critical failure syncing user ${uid}:`, error.message);
    throw error;
  }
}

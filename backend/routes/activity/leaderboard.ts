
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../services/infra/prisma";

// Shared prisma instance

export async function leaderboardRoutes(fastify: FastifyInstance) {
    fastify.get("/leaderboard", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Fetch top 50 users based on a calculated total score
            // For now, we'll calculate a simple total score on the fly or use a stored one
            // Ideally, UserSkillScore would have a `totalScore` field, but we can compute it

            const users = await prisma.userSkillScore.findMany({
                take: 50,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            avatar: true,
                            orcidId: true
                        }
                    }
                },
                // We'll sort by consistency for now as a proxy for engagement, 
                // or we need to compute a total. Prisma doesn't support computed sort easily without raw SQL or a computed column.
                // For this MVP, let's sort by `quality` as a primary metric or just fetch and sort in JS (fine for <1000 users)
                orderBy: {
                    quality: 'desc'
                }
            });

            if (users.length === 0) {
                // Mock Data Fallback for Demo
                return [
                    {
                        id: "1",
                        rank: 1,
                        name: "Blademir Malina Tori",
                        handle: "@popy_bob",
                        avatar: "https://i.pravatar.cc/150?u=1",
                        wins: 443,
                        matches: 778,
                        points: 44872,
                        gems: "32,421",
                        diamonds: "17,500",
                        bestWin: "1:05",
                        isVerifiedResearcher: true
                    },
                    {
                        id: "2",
                        rank: 2,
                        name: "Robert Fox",
                        handle: "@robert_fox",
                        avatar: "https://i.pravatar.cc/150?u=2",
                        wins: 440,
                        matches: 887,
                        points: 42515,
                        gems: "31,001",
                        diamonds: "17,421",
                        bestWin: "1:03",
                        isVerifiedResearcher: false
                    },
                    {
                        id: "3",
                        rank: 3,
                        name: "Molida Glinda",
                        handle: "@molida_glinda",
                        avatar: "https://i.pravatar.cc/150?u=3",
                        wins: 412,
                        matches: 756,
                        points: 40550,
                        gems: "30,987",
                        diamonds: "17,224",
                        bestWin: "1:15",
                        isVerifiedResearcher: false
                    },
                    {
                        id: "4",
                        rank: 4,
                        name: "Jenny Wilson",
                        handle: "@jenny_wilson",
                        avatar: "https://i.pravatar.cc/150?u=4",
                        wins: 398,
                        matches: 720,
                        points: 38200,
                        gems: "28,500",
                        diamonds: "15,800",
                        bestWin: "1:20",
                        isVerifiedResearcher: true
                    },
                    {
                        id: "5",
                        rank: 5,
                        name: "Guy Hawkins",
                        handle: "@guy_hawkins",
                        avatar: "https://i.pravatar.cc/150?u=5",
                        wins: 385,
                        matches: 690,
                        points: 36750,
                        gems: "27,100",
                        diamonds: "14,900",
                        bestWin: "1:25",
                        isVerifiedResearcher: false
                    }
                ];
            }

            // Calculate Total Score and format for frontend
            const leaderboardData = users.map((record, index) => {
                const totalScore = Math.floor(
                    (record.coding * 100) +
                    (record.quality * 50) +
                    (record.communityImpact * 200) + // High weight for community
                    (record.consistency * 100)
                );

                return {
                    id: record.userId,
                    rank: index + 1, // This will be re-calculated after sorting
                    name: record.user.name || record.user.username || "Anonymous",
                    handle: record.user.username ? `@${record.user.username}` : "@user",
                    avatar: record.user.avatar || "https://github.com/ghost.png",
                    wins: Math.floor(record.quality * 2), // Mock: derivation from quality
                    matches: Math.floor(record.coding / 5), // Mock: derivation from coding activity
                    points: totalScore,
                    gems: Math.floor(totalScore / 10).toLocaleString(),
                    diamonds: Math.floor(totalScore / 100).toLocaleString(),
                    bestWin: "1:05", // Mock
                    isVerifiedResearcher: !!record.user.orcidId
                };
            });

            // Re-sort by Total Points
            leaderboardData.sort((a, b) => b.points - a.points);

            // Re-assign ranks
            const rankedData = leaderboardData.map((user, index) => ({
                ...user,
                rank: index + 1
            }));

            return rankedData;

        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            reply.status(500).send({ error: "Failed to fetch leaderboard" });
        }
    });
}





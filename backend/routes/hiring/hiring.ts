import { FastifyInstance } from 'fastify';
import { prisma } from "../../services/infra/prisma";

export async function hiringRoutes(fastify: FastifyInstance) {

    // Get Candidates for Discovery
    fastify.get('/candidates/discovery', async (request, reply) => {
        try {
            const candidates = await prisma.user.findMany({
                where: {
                    freelancerProfile: {
                        isPublic: true
                    },
                    role: {
                        not: "super_admin"
                    }
                },
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    github: true,
                    company: true,
                    role: true,
                    freelancerProfile: true
                },
                take: 50
            });

            // Map to frontend Candidate shape
            const formatted = candidates.map(c => {
                const fp = c.freelancerProfile as any;
                return {
                    id: c.id,
                    name: c.name || "Unknown",
                    role: c.role || "Software Engineer",
                    avatar: c.avatar || `https://ui-avatars.com/api/?name=${c.name || "U"}&background=random`,
                    aiComplexityScore: fp?.aiComplexityScore || 0,
                    prQuality: fp?.prQuality || 0,
                    status: fp?.discoveryStatus || 'Idle',
                    techStackMatch: fp?.techStackMatches ? (fp.techStackMatches as any[]) : []
                };
            });

            if (formatted.length === 0) {
                formatted.push(
                    {
                        id: 'dummy-1',
                        name: 'Alex Chen',
                        role: 'Senior Systems Engineer',
                        avatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=0D8ABC&color=fff',
                        aiComplexityScore: 94,
                        prQuality: 98,
                        status: 'Top Match',
                        techStackMatch: [
                            { skill: 'Rust', alignment: 95 },
                            { skill: 'Distributed Systems', alignment: 90 },
                            { skill: 'Go', alignment: 85 }
                        ]
                    },
                    {
                        id: 'dummy-2',
                        name: 'Sarah Jenkins',
                        role: 'Frontend Architect',
                        avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=B22222&color=fff',
                        aiComplexityScore: 88,
                        prQuality: 95,
                        status: 'Active',
                        techStackMatch: [
                            { skill: 'React', alignment: 98 },
                            { skill: 'TypeScript', alignment: 95 },
                            { skill: 'GraphQL', alignment: 80 }
                        ]
                    }
                );
            }

            return { success: true, candidates: formatted };
        } catch (error) {
            console.error("Error fetching candidates:", error);
            return reply.code(500).send({ success: false, message: 'Failed to fetch candidates' });
        }
    });
}

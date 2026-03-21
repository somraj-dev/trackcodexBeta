import { FastifyInstance } from "fastify";
import { AIOrchestrator, AIProvider } from "../../services/ai/aiOrchestrator";
import { ContextGraph } from "../../services/infra/contextGraph";
import { HandAgent } from "../../services/ai/handAgent";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

export async function forgeAIRoutes(fastify: FastifyInstance) {
  // Context-Aware Completion
  fastify.post("/complete", async (request) => {
    const { prompt, provider, model, workspaceId, systemPrompt } =
      request.body as { prompt: string; provider?: string; model?: string; workspaceId?: string; systemPrompt?: string };

    let enhancedPrompt = prompt;

    // Expand context if workspaceId is provided (Graph Intelligence)
    if (workspaceId) {
      console.log(
        `🧠 ForgeAI: Expanding context for workspace ${workspaceId}...`,
      );
      const context = await ContextGraph.getRelevantContext(
        workspaceId,
        prompt,
      );

      if (context.length > 0) {
        enhancedPrompt = `
Context from current workspace:
${context.map((c) => `File: ${c.fileName}\n${c.content}`).join("\n---\n")}

User Question: ${prompt}
        `.trim();
      }
    }

    return await AIOrchestrator.generateResponse(enhancedPrompt, {
      provider: provider as AIProvider,
      model,
      systemPrompt:
        systemPrompt ||
        "You are ForgeAI, an expert engineering co-pilot. Use the provided context to give highly accurate, technical responses.",
    });
  });

  // Hand Agent Endpoint (SSE Streaming)
  fastify.get(
    "/agent/stream",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { prompt, model, provider } = request.query as { prompt: string; model?: string; provider?: string };
      const user = (request as { user: { userId: string } }).user;

      if (!prompt) {
        return reply.code(400).send({ error: "Prompt is required" });
      }

      // Set headers for SSE
      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.flushHeaders();

      const sendSSE = (event: string, data: any) => {
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        await HandAgent.execute(prompt, {
          model,
          provider: provider as AIProvider,
          userId: user.userId,
          onProgress: (progress) => {
            // progress is already the full object from handAgent.ts
            sendSSE(progress.type, progress.data || progress);
          },
        });
      } catch (error: unknown) {
        sendSSE("error", { message: error instanceof Error ? error.message : "Agent execution failed" });
      } finally {
        reply.raw.end();
      }
    },
  );

  // Neural Synthesis (Direct Code Injection Trigger)
  fastify.post("/synthesize", async () => {
    // Neural synthesis mock - this would use request.body

    // In a real scenario, this would call AuroraAI service to generate files
    // and potentially create a branch or apply directly to a temporary VFS partition.

    return {
      status: "success",
      message:
        "Neural Synthesis partition initialized. Reviewing requirement context...",
      suggestedFiles: [
        "src/components/NewFeature.tsx",
        "src/hooks/useNewFeature.ts",
      ],
    };
  });

  // Get Agent Sessions
  fastify.get(
    "/agent/sessions",
    { preHandler: [requireAuth] },
    async (request) => {
      const user = (request as { user: { userId: string } }).user;
      return await prisma.agentSession.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: "desc" },
        include: { steps: true }
      });
    }
  );

  // Get Single Agent Session
  fastify.get(
    "/agent/session/:id",
    { preHandler: [requireAuth] },
    async (request) => {
      const { id } = request.params as { id: string };
      return await prisma.agentSession.findUnique({
        where: { id },
        include: { steps: true }
      });
    }
  );
}






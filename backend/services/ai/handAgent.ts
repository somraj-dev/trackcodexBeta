import { AIOrchestrator, AIProvider } from "./aiOrchestrator";
import { prisma } from "../../lib/prisma";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export interface AgentStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string | null;
  toolCalls?: Record<string, unknown>[];
}

export interface AgentProgress {
  type: "plan" | "step_start" | "tool_call" | "tool_result" | "step_complete" | "done" | "error";
  data?: unknown;
  stepId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
}

export class HandAgent {
  private static tools: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
    web_search: async (args: Record<string, unknown>) => {
      const query = args.query as string;
      // Mocking web search for now - in a real app, this would use Google/Tavily API
      return `Search results for "${query}": Recent trends in TrackCodex development show increased adoption of agentic features.`;
    },
    file_read: async (args: Record<string, unknown>) => {
      const filePath = args.filePath as string;
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        return await fs.readFile(fullPath, "utf-8");
      } catch (e: unknown) {
        return `Error reading file: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    file_write: async (args: Record<string, unknown>) => {
      const filePath = args.filePath as string;
      const content = args.content as string;
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, "utf-8");
        return `Successfully wrote to ${filePath}`;
      } catch (e: unknown) {
        return `Error writing file: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    shell_exec: async (args: Record<string, unknown>) => {
      const command = args.command as string;
      try {
        const { stdout, stderr } = await execPromise(command);
        return stdout || stderr || "Command executed successfully (no output).";
      } catch (e: unknown) {
        return `Command failed: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
  };

  private static toolDefinitions: ToolDefinition[] = [
    {
      name: "web_search",
      description: "Search the web for information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" }
        },
        required: ["query"]
      }
    },
    {
      name: "file_read",
      description: "Read the contents of a file in the workspace",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Relative or absolute path to the file" }
        },
        required: ["filePath"]
      }
    },
    {
      name: "file_write",
      description: "Create or overwrite a file with specific content",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path where the file should be saved" },
          content: { type: "string", description: "The text content to write" }
        },
        required: ["filePath", "content"]
      }
    },
    {
      name: "shell_exec",
      description: "Execute a terminal command (WARNING: User permission may be needed)",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The shell command to run" }
        },
        required: ["command"]
      }
    }
  ];

  static async execute(
    prompt: string,
    options: {
      model?: string;
      provider?: AIProvider;
      userId: string;
      onProgress?: (progress: AgentProgress) => void;
    }
  ) {
    const { model = "gemini-1.5-flash", provider = "google", userId, onProgress } = options;

    try {
      // 0. CREATE SESSION
      const session = await prisma.agentSession.create({
        data: {
          userId,
          prompt,
          model,
          provider: provider as string,
          status: "ACTIVE",
        }
      });

      // 1. PLANNING PHASE
      const planPrompt = `
You are the Hand Agent Planner. Decompose the following user request into a 3-6 step executable plan.
Each step should have a title and a brief description of what to achieve.

USER REQUEST: "${prompt}"

Respond in JSON format:
{
  "steps": [
    { "id": "1", "title": "Step title", "description": "Step description" },
    ...
  ]
}
      `.trim();

      const planResponse = await AIOrchestrator.generateResponse(planPrompt, {
        model,
        provider,
        systemPrompt: "You are a senior task planner. Respond only with JSON.",
      });

      let steps: AgentStep[] = [];
      try {
        const parsed = JSON.parse(planResponse.content.replace(/```json/g, "").replace(/```/g, "").trim());
        steps = parsed.steps.map((s: AgentStep) => ({ ...s, status: "pending" as const }));
      } catch (error: unknown) {
        // Fallback if AI fails to give JSON
        console.error("Failed to parse agent plan:", error instanceof Error ? error.message : String(error));
        steps = [{ id: "1", title: "Process Request", description: "Executing user request", status: "pending" as const }];
      }

      // Persist steps to DB
      await prisma.agentStep.createMany({
        data: steps.map((s, idx) => ({
          sessionId: session.id,
          id: s.id, 
          title: s.title,
          description: s.description,
          status: "PENDING",
          position: idx
        }))
      });

      onProgress?.({ type: "plan", data: steps });

      // 2. EXECUTION PHASE
      let accumulatedContext = "";
      const results: string[] = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        step.status = "running";

        await prisma.agentStep.update({
          where: { id: step.id },
          data: { status: "RUNNING" }
        });

        onProgress?.({ type: "step_start", stepId: step.id });

        let stepTurn = 0;
        const maxTurns = 3;
        let stepAccumulatedResults = "";

        while (stepTurn < maxTurns) {
          stepTurn++;
          const stepPrompt = `
You are the Hand Agent Executor. Execute Step ${step.id} of the plan.
Current Plan:
${steps.map((s, idx) => `${s.id === step.id ? '▶' : ' '} ${idx + 1}. ${s.title}: ${s.description}`).join("\n")}

Previous Results Context:
${accumulatedContext}

CURRENT STEP: ${step.title}
INTENT: ${step.description}
STEP SUB-RESULTS SO FAR:
${stepAccumulatedResults}

AVALIABLE TOOLS:
${JSON.stringify(HandAgent.toolDefinitions, null, 2)}

To use a tool, respond ONLY with:
TOOL_CALL: { "name": "tool_name", "args": { ... } }

If you have finished this step, respond with:
STEP_COMPLETE: Detailed summary of what was achieved in this step.
        `.trim();

          const stepResponse = await AIOrchestrator.generateResponse(stepPrompt, {
            model,
            provider,
            systemPrompt: "You are a high-level engineering agent. You can use tools to perform tasks.",
          });

          const content = stepResponse.content.trim();

          if (content.startsWith("TOOL_CALL:")) {
            try {
              const toolCall = JSON.parse(content.replace("TOOL_CALL:", "").trim()) as { name: string; args: Record<string, unknown> };
              onProgress?.({ type: "tool_call", stepId: step.id, data: toolCall });
              
              const toolFn = HandAgent.tools[toolCall.name];
              if (toolFn) {
                const result = await toolFn(toolCall.args);
                onProgress?.({ type: "tool_result", stepId: step.id, data: { name: toolCall.name, result } });
                stepAccumulatedResults += `\n[Tool: ${toolCall.name}] Input: ${JSON.stringify(toolCall.args)}\nOutput: ${result}\n`;
              } else {
                stepAccumulatedResults += `\nError: Tool "${toolCall.name}" not found.\n`;
              }
            } catch (error: unknown) {
              stepAccumulatedResults += `\nError parsing tool call: ${error instanceof Error ? error.message : String(error)}\n`;
            }
          } else if (content.startsWith("STEP_COMPLETE:")) {
            step.result = content.replace("STEP_COMPLETE:", "").trim();
            break;
          } else {
            // If it just gives text without tag, assume it's part of the process or completion
            step.result = content;
            break;
          }
        }

        step.status = "completed";

        await prisma.agentStep.update({
          where: { id: step.id },
          data: { 
            status: "COMPLETED",
            result: step.result,
            toolCalls: step.toolCalls as any // Cast to any to satisfy Prisma InputJsonValue index signature
          }
        });

        accumulatedContext += `\n\n--- Result of Step: ${step.title} ---\n${step.result}`;
        results.push(step.result || "");

        onProgress?.({ type: "step_complete", stepId: step.id });
      }

      // 3. SYNTHESIS PHASE
      const synthesisPrompt = `
Synthesize the final answer for the user based on the completed multi-step plan.
ORIGINAL REQUEST: "${prompt}"

EXECUTION LOG:
${accumulatedContext}

Provide a final, polished, coherent response that addresses the user's request. Use markdown.
      `.trim();

      const finalResponse = await AIOrchestrator.generateResponse(synthesisPrompt, {
        model,
        provider,
        systemPrompt: "You are a master synthesizer. Create a beautiful final report.",
      });

      await prisma.agentSession.update({
        where: { id: session.id },
        data: { 
          status: "COMPLETED",
          result: finalResponse.content
        }
      });

      onProgress?.({ type: "done", data: finalResponse.content });

      return {
        id: session.id,
        plan: steps,
        finalResult: finalResponse.content
      };

    } catch (error: unknown) {
      console.error("HandAgent Error:", error);
      onProgress?.({ type: "error", data: error instanceof Error ? error.message : "Unknown error occurred" });
      throw error;
    }
  }
}

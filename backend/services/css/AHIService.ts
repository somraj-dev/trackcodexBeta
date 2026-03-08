/**
 * AHI (AI Hypothesis Intelligence) Service
 * ==========================================
 * Validates vulnerability hypotheses using AI.
 * Produces structured JSON output with exploitability, severity,
 * reasoning, and secure patch suggestions.
 *
 * Integrates with TrackCodex AIOrchestrator.
 */

import { AIOrchestrator } from "../aiOrchestrator";

// --- Types ---

export interface AHIInput {
    codeSnippet: string;
    dataFlowPath: string;
    ruleMetadata: {
        vulnerabilityType: string;
        detectedPattern: string;
        source: string;
        sink: string;
    };
    shannonResult?: {
        exploitable: boolean;
        confidence: number;
        details: string;
    } | null;
}

export interface AHIOutput {
    isExploitable: boolean;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
    reasoning: string;
    securePatchCode: string;
    confidence: number; // 0 to 1
}

// --- System Prompt (Strict JSON-only) ---

const AHI_SYSTEM_PROMPT = `You are TrackCodex AHI (AI Hypothesis Intelligence), a security validation engine.
Your role is to validate exploit hypotheses for code vulnerabilities.

CRITICAL RULES:
1. You MUST return ONLY valid JSON. No markdown. No explanation outside JSON.
2. You MUST validate whether the vulnerability is actually exploitable.
3. You MUST provide a secure patch that fixes the vulnerability.
4. You MUST assign a confidence score between 0.0 and 1.0.

OUTPUT FORMAT (strict JSON, nothing else):
{
  "isExploitable": true|false,
  "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW"|"INFO",
  "reasoning": "Brief technical explanation of why this is or is not exploitable",
  "securePatchCode": "The fixed version of the vulnerable code",
  "confidence": 0.0-1.0
}`;

// --- Service Class ---

export class AHIService {
    /**
     * Validate a vulnerability hypothesis using AI.
     */
    static async validateHypothesis(input: AHIInput): Promise<AHIOutput> {
        const prompt = this.buildPrompt(input);

        try {
            console.log(
                `🧠 [AHI] Validating hypothesis: ${input.ruleMetadata.vulnerabilityType}`
            );

            const response = await AIOrchestrator.generateResponse(prompt, {
                systemPrompt: AHI_SYSTEM_PROMPT,
                model: "gemini-2.0-flash",
            });

            const parsed = this.parseResponse(response.content);

            console.log(
                `✅ [AHI] Validation complete — exploitable: ${parsed.isExploitable}, ` +
                `severity: ${parsed.severity}, confidence: ${parsed.confidence}`
            );

            return parsed;
        } catch (error: any) {
            console.error(`❌ [AHI] Validation failed: ${error.message}`);
            // Default to conservative assessment on AI failure
            return {
                isExploitable: false,
                severity: "INFO",
                reasoning: `AHI validation failed: ${error.message}. Manual review recommended.`,
                securePatchCode: "",
                confidence: 0,
            };
        }
    }

    /**
     * Build the structured prompt for AHI.
     */
    private static buildPrompt(input: AHIInput): string {
        let prompt = `VULNERABILITY HYPOTHESIS VALIDATION REQUEST

## Code Under Analysis
\`\`\`
${input.codeSnippet}
\`\`\`

## Detected Vulnerability
- Type: ${input.ruleMetadata.vulnerabilityType}
- Pattern: ${input.ruleMetadata.detectedPattern}
- Source (user input entry): ${input.ruleMetadata.source}
- Sink (dangerous function): ${input.ruleMetadata.sink}

## Data Flow Path
${input.dataFlowPath}`;

        if (input.shannonResult) {
            prompt += `

## Shannon Exploit Validation Result
- Exploitable: ${input.shannonResult.exploitable}
- Confidence: ${input.shannonResult.confidence}
- Details: ${input.shannonResult.details}`;
        }

        prompt += `

Analyze the above and respond with ONLY the JSON validation result.`;

        return prompt;
    }

    /**
     * Parse AHI response — extract JSON from potentially noisy output.
     */
    private static parseResponse(raw: string): AHIOutput {
        // Try direct JSON parse first
        try {
            const cleaned = raw.trim();
            // Remove markdown code fences if present
            const jsonStr = cleaned
                .replace(/```json\s*/gi, "")
                .replace(/```\s*/gi, "")
                .trim();

            const parsed = JSON.parse(jsonStr);

            return {
                isExploitable: Boolean(parsed.isExploitable),
                severity: this.normalizeSeverity(parsed.severity),
                reasoning: String(parsed.reasoning || "No reasoning provided"),
                securePatchCode: String(parsed.securePatchCode || ""),
                confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
            };
        } catch {
            // Try to extract JSON from within the response
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        isExploitable: Boolean(parsed.isExploitable),
                        severity: this.normalizeSeverity(parsed.severity),
                        reasoning: String(parsed.reasoning || "No reasoning provided"),
                        securePatchCode: String(parsed.securePatchCode || ""),
                        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
                    };
                } catch {
                    // Fall through to default
                }
            }

            console.warn(
                `⚠️ [AHI] Could not parse response as JSON. Raw: ${raw.substring(0, 200)}`
            );

            return {
                isExploitable: false,
                severity: "INFO",
                reasoning: "Failed to parse AHI response. Manual review recommended.",
                securePatchCode: "",
                confidence: 0,
            };
        }
    }

    /**
     * Normalize severity strings.
     */
    private static normalizeSeverity(
        severity: string
    ): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" {
        const normalized = String(severity).toUpperCase().trim();
        const validValues = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const;
        if (validValues.includes(normalized as any)) {
            return normalized as (typeof validValues)[number];
        }
        return "INFO";
    }
}






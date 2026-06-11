import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

// Map friendly model keys to Lovable AI Gateway model strings.
// Students: this is where you decide which AI model to call.
const MODEL_MAP = {
  openai: "openai/gpt-5-mini",
  gemini: "google/gemini-3-flash-preview",
} as const;

const InputSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(5000),
  model: z.enum(["openai", "gemini"]),
});

export const generatePrompt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    // The API key is read ONLY on the server, from environment variables.
    // It is NEVER sent to the browser. This is why .env files exist.
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing LOVABLE_API_KEY on the server.");
    }

    const gateway = createLovableAiGatewayProvider(apiKey);
    const modelId = MODEL_MAP[data.model];

    const startedAt = Date.now();
    try {
      const result = await generateText({
        model: gateway(modelId),
        prompt: data.prompt,
      });
      const elapsedMs = Date.now() - startedAt;

      // usage may be undefined depending on the provider response.
      const usage = result.usage ?? null;

      return {
        success: true as const,
        response: result.text,
        model: data.model,
        modelId,
        responseTimeMs: elapsedMs,
        responseTime: `${(elapsedMs / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString(),
        usage: usage
          ? {
              promptTokens: usage.inputTokens ?? null,
              completionTokens: usage.outputTokens ?? null,
              totalTokens: usage.totalTokens ?? null,
            }
          : null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Surface common gateway errors with friendly text.
      if (/429/.test(message)) {
        throw new Error("Rate limit reached. Please wait a moment and try again.");
      }
      if (/402/.test(message)) {
        throw new Error("AI credits exhausted. Add credits to keep generating.");
      }
      if (/401|403|invalid api key/i.test(message)) {
        throw new Error("Invalid API key detected on the server.");
      }
      throw new Error(`AI request failed: ${message}`);
    }
  });
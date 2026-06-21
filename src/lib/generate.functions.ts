import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateGeminiText } from "./gemini.server";
import { checkRateLimit } from "./rate-limit.server";

// Map friendly model keys to Gemini model strings.
// Students: this is where you decide which Gemini model to call.
const MODEL_MAP = {
  gemini: "gemini-2.5-flash",
} as const;

export const InputSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(5000),
  model: z.enum(["gemini"]),
});

export function mapGeminiError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (/429/.test(message)) {
    return new Error("Rate limit reached. Please wait a moment and try again.");
  }
  if (/402/.test(message)) {
    return new Error("AI credits exhausted. Add credits to keep generating.");
  }
  if (/400/.test(message)) {
    return new Error("Gemini rejected the request. Check the model name and API key restrictions.");
  }
  if (/401|403|api key|permission/i.test(message)) {
    return new Error("Invalid API key detected on the server.");
  }
  console.error("[generatePrompt] Unexpected AI error:", message);
  return new Error("AI request failed. Please try again later.");
}

export const generatePrompt = createServerFn({ method: "POST" })
  .validator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const clientIp = "global";
    const { allowed, retryAfterMs } = checkRateLimit(clientIp);
    if (!allowed) {
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds before trying again.`,
      );
    }

    // The API key is read ONLY on the server, from environment variables.
    // It is NEVER sent to the browser. This is why .env files exist.
    if (!(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY)) {
      throw new Error("Missing GEMINI_API_KEY on the server.");
    }

    const modelId = MODEL_MAP[data.model];

    const startedAt = Date.now();
    try {
      const result = await generateGeminiText(data.prompt, modelId);
      const elapsedMs = Date.now() - startedAt;

      return {
        success: true as const,
        response: result.text,
        model: data.model,
        modelId,
        responseTimeMs: elapsedMs,
        responseTime: `${(elapsedMs / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString(),
        usage: result.usage,
      };
    } catch (err: unknown) {
      throw mapGeminiError(err);
    }
  });

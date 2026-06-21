import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateGeminiText } from "./gemini.server";
import { checkRateLimit } from "./rate-limit.server";

// Map friendly model keys to Gemini model strings.
// Students: this is where you decide which Gemini model to call.
const MODEL_MAP = {
  gemini: "gemini-2.5-flash",
} as const;

const InputSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(5000),
  model: z.enum(["gemini"]),
});

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
      const message = err instanceof Error ? err.message : String(err);
      const statusCode =
        err instanceof Error && "statusCode" in err
          ? (err as Error & { statusCode: number }).statusCode
          : undefined;

      if (statusCode === 429) {
        throw new Error("Rate limit reached. Please wait a moment and try again.");
      }
      if (statusCode === 402) {
        throw new Error("AI credits exhausted. Add credits to keep generating.");
      }
      if (statusCode === 400) {
        throw new Error(
          "Gemini rejected the request. Check the model name and API key restrictions.",
        );
      }
      if (statusCode === 401 || statusCode === 403) {
        throw new Error("Invalid API key detected on the server.");
      }
      console.error("[generatePrompt] Unexpected AI error:", message);
      throw new Error("AI request failed. Please try again later.");
    }
  });

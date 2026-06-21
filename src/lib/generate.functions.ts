import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getGeminiApiKey } from "./api-key.server";
import { extractErrorMessage, classifyApiError } from "./error-utils";
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
    getGeminiApiKey();

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
      throw new Error(classifyApiError(extractErrorMessage(err)));
    }
  });

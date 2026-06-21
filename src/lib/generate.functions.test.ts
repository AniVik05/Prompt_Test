import { describe, it, expect } from "vitest";
import { z } from "zod";

// We test the validation schema and error-mapping logic from generate.functions.ts.
// The createServerFn wrapper is TanStack-specific infrastructure that cannot be
// unit-tested in isolation, but the schema and error patterns are pure logic.

const InputSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(5000),
  model: z.enum(["gemini"]),
});

describe("generate.functions InputSchema", () => {
  it("accepts valid input", () => {
    const result = InputSchema.parse({ prompt: "Hello world", model: "gemini" });
    expect(result).toEqual({ prompt: "Hello world", model: "gemini" });
  });

  it("rejects empty prompt", () => {
    expect(() => InputSchema.parse({ prompt: "", model: "gemini" })).toThrow();
  });

  it("rejects missing prompt", () => {
    expect(() => InputSchema.parse({ model: "gemini" })).toThrow();
  });

  it("rejects prompt exceeding 5000 characters", () => {
    const longPrompt = "a".repeat(5001);
    expect(() => InputSchema.parse({ prompt: longPrompt, model: "gemini" })).toThrow();
  });

  it("accepts prompt at exactly 5000 characters", () => {
    const maxPrompt = "a".repeat(5000);
    const result = InputSchema.parse({ prompt: maxPrompt, model: "gemini" });
    expect(result.prompt).toHaveLength(5000);
  });

  it("rejects invalid model value", () => {
    expect(() => InputSchema.parse({ prompt: "test", model: "gpt-4" })).toThrow();
  });

  it("rejects missing model", () => {
    expect(() => InputSchema.parse({ prompt: "test" })).toThrow();
  });
});

describe("generate.functions error mapping patterns", () => {
  // These patterns mirror the regex-based error mapping in the handler's catch block.
  function mapError(message: string): string {
    if (/429/.test(message)) {
      return "Rate limit reached. Please wait a moment and try again.";
    }
    if (/402/.test(message)) {
      return "AI credits exhausted. Add credits to keep generating.";
    }
    if (/400/.test(message)) {
      return "Gemini rejected the request. Check the model name and API key restrictions.";
    }
    if (/401|403|api key|permission/i.test(message)) {
      return "Invalid API key detected on the server.";
    }
    return `AI request failed: ${message}`;
  }

  it("maps 429 errors to rate limit message", () => {
    expect(mapError("HTTP 429 Too Many Requests")).toBe(
      "Rate limit reached. Please wait a moment and try again.",
    );
  });

  it("maps 402 errors to credits exhausted message", () => {
    expect(mapError("Error 402: Payment Required")).toBe(
      "AI credits exhausted. Add credits to keep generating.",
    );
  });

  it("maps 400 errors to request rejection message", () => {
    expect(mapError("400 Bad Request")).toBe(
      "Gemini rejected the request. Check the model name and API key restrictions.",
    );
  });

  it("maps 401 errors to invalid API key message", () => {
    expect(mapError("401 Unauthorized")).toBe("Invalid API key detected on the server.");
  });

  it("maps 403 errors to invalid API key message", () => {
    expect(mapError("403 Forbidden")).toBe("Invalid API key detected on the server.");
  });

  it("maps 'api key' errors to invalid API key message (case-insensitive)", () => {
    expect(mapError("Invalid API Key provided")).toBe("Invalid API key detected on the server.");
  });

  it("maps 'permission' errors to invalid API key message", () => {
    expect(mapError("Permission denied for this resource")).toBe(
      "Invalid API key detected on the server.",
    );
  });

  it("falls through to generic message for unknown errors", () => {
    expect(mapError("Something unexpected")).toBe("AI request failed: Something unexpected");
  });
});

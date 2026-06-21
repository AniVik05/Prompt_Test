import { describe, it, expect } from "vitest";
import { InputSchema, mapGeminiError } from "./generate.functions";

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

describe("mapGeminiError", () => {
  it("maps 429 errors to rate limit message", () => {
    const err = mapGeminiError(new Error("HTTP 429 Too Many Requests"));
    expect(err.message).toBe("Rate limit reached. Please wait a moment and try again.");
  });

  it("maps 402 errors to credits exhausted message", () => {
    const err = mapGeminiError(new Error("Error 402: Payment Required"));
    expect(err.message).toBe("AI credits exhausted. Add credits to keep generating.");
  });

  it("maps 400 errors to request rejection message", () => {
    const err = mapGeminiError(new Error("400 Bad Request"));
    expect(err.message).toBe(
      "Gemini rejected the request. Check the model name and API key restrictions.",
    );
  });

  it("maps 401 errors to invalid API key message", () => {
    const err = mapGeminiError(new Error("401 Unauthorized"));
    expect(err.message).toBe("Invalid API key detected on the server.");
  });

  it("maps 403 errors to invalid API key message", () => {
    const err = mapGeminiError(new Error("403 Forbidden"));
    expect(err.message).toBe("Invalid API key detected on the server.");
  });

  it("maps 'api key' errors to invalid API key message (case-insensitive)", () => {
    const err = mapGeminiError(new Error("Invalid API Key provided"));
    expect(err.message).toBe("Invalid API key detected on the server.");
  });

  it("maps 'permission' errors to invalid API key message", () => {
    const err = mapGeminiError(new Error("Permission denied for this resource"));
    expect(err.message).toBe("Invalid API key detected on the server.");
  });

  it("falls through to generic message for unknown errors", () => {
    const err = mapGeminiError(new Error("Something unexpected"));
    expect(err.message).toBe("AI request failed. Please try again later.");
  });

  it("handles non-Error values", () => {
    const err = mapGeminiError("string error");
    expect(err.message).toBe("AI request failed. Please try again later.");
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateGeminiText } from "./gemini.server";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("generateGeminiText", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when GEMINI_API_KEY is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    await expect(generateGeminiText("hello", "gemini-2.5-flash")).rejects.toThrow(
      "Missing GEMINI_API_KEY",
    );
  });

  it("falls back to GOOGLE_API_KEY when GEMINI_API_KEY is absent", async () => {
    delete process.env.GEMINI_API_KEY;
    vi.stubEnv("GOOGLE_API_KEY", "google-key");

    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "hi" }] } }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 },
      }),
    );

    const result = await generateGeminiText("hello", "gemini-2.5-flash");
    expect(result.text).toBe("hi");
    expect(mockFetch).toHaveBeenCalledOnce();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("key=google-key");
  });

  it("returns text and usage on successful response", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "Hello " }, { text: "world" }] } }],
        usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 10, totalTokenCount: 15 },
      }),
    );

    const result = await generateGeminiText("test prompt", "gemini-2.5-flash");

    expect(result.text).toBe("Hello world");
    expect(result.usage).toEqual({
      promptTokens: 5,
      completionTokens: 10,
      totalTokens: 15,
    });
  });

  it("builds the correct API URL", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "ok" }] } }],
      }),
    );

    await generateGeminiText("prompt", "gemini-2.5-flash");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain(
      "generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    );
    expect(url).toContain("key=test-key");
  });

  it("sends the prompt in the correct request body shape", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "ok" }] } }],
      }),
    );

    await generateGeminiText("my prompt", "gemini-2.5-flash");

    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({
      contents: [{ role: "user", parts: [{ text: "my prompt" }] }],
    });
  });

  it("throws with API error message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: { code: 429, message: "Rate limit exceeded" } }, 429),
    );

    await expect(generateGeminiText("test", "gemini-2.5-flash")).rejects.toThrow(
      "Rate limit exceeded",
    );
  });

  it("throws generic message when API error lacks message field", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 503));

    await expect(generateGeminiText("test", "gemini-2.5-flash")).rejects.toThrow(
      "Gemini request failed with status 503",
    );
  });

  it("throws when response has no text candidates", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ candidates: [] }));

    await expect(generateGeminiText("test", "gemini-2.5-flash")).rejects.toThrow(
      "Gemini returned no text output.",
    );
  });

  it("throws with finishReason when no text and finishReason is present", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ content: { parts: [] }, finishReason: "SAFETY" }],
      }),
    );

    await expect(generateGeminiText("test", "gemini-2.5-flash")).rejects.toThrow(
      "Gemini returned no text output (SAFETY)",
    );
  });

  it("throws when response body is not valid JSON", async () => {
    mockFetch.mockResolvedValueOnce(new Response("not json", { status: 500 }));

    await expect(generateGeminiText("test", "gemini-2.5-flash")).rejects.toThrow();
  });

  it("returns null usage fields when usageMetadata is missing", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "response" }] } }],
      }),
    );

    const result = await generateGeminiText("test", "gemini-2.5-flash");
    expect(result.usage).toEqual({
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    });
  });

  it("joins text from multiple candidates", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        candidates: [
          { content: { parts: [{ text: "a" }] } },
          { content: { parts: [{ text: "b" }] } },
        ],
      }),
    );

    const result = await generateGeminiText("test", "gemini-2.5-flash");
    expect(result.text).toBe("ab");
  });
});

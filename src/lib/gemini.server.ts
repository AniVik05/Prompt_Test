import process from "node:process";

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

type GeminiErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

export async function generateGeminiText(prompt: string, model: string) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY on the server.");
  }

  const response = await fetch(`${GEMINI_API_BASE_URL}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | (GeminiGenerateResponse & GeminiErrorResponse)
    | null;

  if (!response.ok) {
    const message =
      payload?.error?.message ?? `Gemini request failed with status ${response.status}.`;
    const error = new Error(message);
    (error as Error & { statusCode: number }).statusCode = response.status;
    throw error;
  }

  const text =
    payload?.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) {
    const finishReason = payload?.candidates?.[0]?.finishReason;
    throw new Error(
      finishReason
        ? `Gemini returned no text output (${finishReason}).`
        : "Gemini returned no text output.",
    );
  }

  return {
    text,
    usage: {
      promptTokens: payload?.usageMetadata?.promptTokenCount ?? null,
      completionTokens: payload?.usageMetadata?.candidatesTokenCount ?? null,
      totalTokens: payload?.usageMetadata?.totalTokenCount ?? null,
    },
  };
}

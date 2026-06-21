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

  const sanitizedPrompt = prompt.trim().slice(0, 5000);
  if (!sanitizedPrompt) {
    throw new Error("Prompt cannot be empty.");
  }

  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: sanitizedPrompt }],
          },
        ],
      }),
    },
  );

  let payload: (GeminiGenerateResponse & GeminiErrorResponse) | null = null;
  try {
    payload = (await response.json()) as GeminiGenerateResponse & GeminiErrorResponse;
  } catch (parseError) {
    const rawBody = await response
      .clone()
      .text()
      .catch(() => "[unreadable body]");
    console.error("Gemini response JSON parse failed:", parseError, "Raw body:", rawBody);
    throw new Error(
      `Gemini returned a non-JSON response (HTTP ${response.status}). Body: ${rawBody.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ?? `Gemini request failed with status ${response.status}.`;
    throw new Error(message);
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

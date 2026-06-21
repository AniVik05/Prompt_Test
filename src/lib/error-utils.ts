export function extractErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const API_ERROR_MAP: ReadonlyArray<{ pattern: RegExp; message: string }> = [
  { pattern: /429/, message: "Rate limit reached. Please wait a moment and try again." },
  { pattern: /402/, message: "AI credits exhausted. Add credits to keep generating." },
  {
    pattern: /400/,
    message: "Gemini rejected the request. Check the model name and API key restrictions.",
  },
  { pattern: /401|403|api key|permission/i, message: "Invalid API key detected on the server." },
];

export function classifyApiError(rawMessage: string): string {
  for (const { pattern, message } of API_ERROR_MAP) {
    if (pattern.test(rawMessage)) return message;
  }
  console.error("[generatePrompt] Unexpected AI error:", rawMessage);
  return "AI request failed. Please try again later.";
}

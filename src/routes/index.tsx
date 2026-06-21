import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { generatePrompt } from "@/lib/generate.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Tester — Learn AI APIs" },
      {
        name: "description",
        content:
          "Educational playground for testing and comparing AI prompts. Learn prompt engineering, API integration, and environment variables.",
      },
      { property: "og:title", content: "Prompt Tester — Learn AI APIs" },
      {
        property: "og:description",
        content: "Educational playground for testing and comparing AI prompts.",
      },
    ],
  }),
  component: Index,
});

type GenerateResult = Awaited<ReturnType<typeof generatePrompt>>;

const MODELS = [{ value: "gemini", label: "Google Gemini" }] as const;

function Index() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"gemini">("gemini");
  const [error, setError] = useState<string | null>(null);

  const generateFn = useServerFn(generatePrompt);
  const mutation = useMutation<GenerateResult, Error, { prompt: string; model: "gemini" }>({
    mutationFn: (vars) => generateFn({ data: vars }),
    onError: (err) => setError(err.message),
    onSuccess: () => setError(null),
  });

  const result = mutation.data ?? null;
  const isLoading = mutation.isPending;

  const handleRun = () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Please enter a prompt.");
      return;
    }
    setError(null);
    mutation.mutate({ prompt: trimmed, model });
  };

  const handleClear = () => {
    setPrompt("");
    setError(null);
    mutation.reset();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <SparkIcon />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Prompt Tester</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Test and compare prompts using AI APIs
              </p>
            </div>
          </div>
        </header>

        <main className="grid gap-6">
          {/* Prompt + model card */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/20 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor="prompt" className="text-sm font-medium">
                Your prompt
              </label>
              <div className="flex items-center gap-2">
                <label htmlFor="model" className="text-xs text-muted-foreground">
                  Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value as "gemini")}
                  disabled={isLoading}
                  className="rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={6}
              maxLength={5000}
              disabled={isLoading}
              className="w-full resize-y rounded-xl border border-border bg-input p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                {prompt.length} / 5000 characters
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading || prompt.length === 0}
                  className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Clear Prompt
                </button>
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      Generating response…
                    </>
                  ) : (
                    "Run Prompt"
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {error}
              </div>
            )}
          </section>

          {/* Response + API usage */}
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/20 sm:p-6 lg:col-span-2">
              <h2 className="mb-3 text-lg font-semibold">AI Response</h2>
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner /> Generating response…
                </div>
              )}
              {!isLoading && !result && (
                <p className="text-sm text-muted-foreground">
                  Run a prompt to see the model's response here.
                </p>
              )}
              {result && (
                <>
                  <pre className="whitespace-pre-wrap break-words rounded-xl bg-background/50 p-4 text-sm leading-relaxed text-foreground">
                    {result.response}
                  </pre>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                    <MetaPill label="Model" value={result.model.toUpperCase()} />
                    <MetaPill label="Response time" value={result.responseTime} />
                    <MetaPill
                      label="Timestamp"
                      value={new Date(result.timestamp).toLocaleTimeString()}
                    />
                  </div>
                </>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/20 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">API Usage</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Behind the scenes data — useful for understanding API consumption.
              </p>
              <dl className="space-y-2 text-sm">
                <UsageRow label="Model used" value={result?.modelId ?? "—"} />
                <UsageRow
                  label="API call status"
                  value={isLoading ? "In progress" : result ? "Success" : error ? "Error" : "Idle"}
                />
                <UsageRow label="Response time" value={result?.responseTime ?? "—"} />
                <UsageRow
                  label="Prompt tokens"
                  value={result?.usage?.promptTokens?.toString() ?? "—"}
                />
                <UsageRow
                  label="Completion tokens"
                  value={result?.usage?.completionTokens?.toString() ?? "—"}
                />
                <UsageRow
                  label="Total tokens"
                  value={result?.usage?.totalTokens?.toString() ?? "—"}
                />
              </dl>
            </section>
          </div>

          {/* Educational panel */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/20 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Learning corner</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <LearnCard
                title="What is a Prompt?"
                body="A prompt is the instruction or question you send to an AI model. Better prompts (clear context, format hints, examples) usually give better results."
              />
              <LearnCard
                title="What is an API?"
                body="An API (Application Programming Interface) lets your code talk to another service over the internet. Your app sends a request, the AI provider sends back a response."
              />
              <LearnCard
                title="Why use .env files?"
                body="Environment variables keep secrets like API keys out of your source code. Your server reads them at runtime so different environments (dev/prod) can use different values."
              />
              <LearnCard
                title="Why never push API keys to GitHub?"
                body="Public keys can be scraped within minutes, burning your credits or exposing user data. Always git-ignore .env files and store secrets on the server only."
              />
            </div>
          </section>

          <footer className="pt-4 pb-8 text-center text-xs text-muted-foreground">
            Built for learning — Prompt Tester demo.
          </footer>
        </main>
      </div>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm text-foreground">{value}</div>
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs text-foreground">{value}</dd>
    </div>
  );
}

function LearnCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-current"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 3l1.8 4.6L18.4 9.4 13.8 11.2 12 15.8 10.2 11.2 5.6 9.4 10.2 7.6 12 3z"
        fill="currentColor"
      />
      <path
        d="M19 14l.9 2.3L22 17.2l-2.1.9L19 20.4l-.9-2.3L16 17.2l2.1-.9L19 14z"
        fill="currentColor"
      />
    </svg>
  );
}

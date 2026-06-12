# Prompt Tester

An educational demo app for teaching **Prompt Engineering**, **API integration**,
**environment variables**, and **frontend ↔ backend communication**.

Students can:

- Enter a prompt
- Choose an AI model (OpenAI GPT or Google Gemini)
- See the response, response time, and token usage
- Learn why API keys must never live in source code

## Stack

This project runs on the Lovable platform, which provides a single integrated stack:

- **React + TanStack Start** (file-based routing, SSR-ready)
- **Tailwind CSS** for styling
- **TanStack Query** for client data
- **Server functions** (`createServerFn`) instead of a separate Express server —
  same idea (HTTP boundary between browser and server), simpler to run
- **Google Gemini API** for sending prompts directly with your own API key

> The original brief asked for `client/` + `server/` (Express) + a root `.env`.
> On Lovable, the platform provides the server runtime, so the equivalent
> "Express POST /api/generate" lives in `src/lib/generate.functions.ts` as a
> server function. The teaching points (env vars, keys stay on the server,
> request/response shape, response time, token usage) are all preserved.

## Where the secret lives

The AI key (`GEMINI_API_KEY`) is stored as a **server-side environment
variable**. It is read **only inside the server function**:

```ts
// src/lib/generate.functions.ts
const apiKey = process.env.GEMINI_API_KEY;
```

It is never bundled into the browser. This is exactly why real apps use `.env`
files + a `.gitignore` entry: secrets stay on the server.

## Run locally

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Then open `.env.local` and replace the placeholder with your own Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Open the local preview URL shown in your terminal.

## Files to read with students

- `src/routes/index.tsx` — the UI (prompt input, model picker, response card,
  API-usage panel, learning corner)
- `src/lib/generate.functions.ts` — the "backend": validates input, reads the
  API key, calls the AI model, returns a JSON response
- `src/lib/gemini.server.ts` — thin wrapper that calls the Gemini API

## Talking points

1. **Prompt** — the text we send to the model.
2. **API call** — `Run Prompt` triggers the server function over HTTP.
3. **Env vars** — the key is read from `process.env`, never hardcoded.
4. **Response time + tokens** — the panel on the right shows how much you
   consumed; this is what providers charge for.
5. **Error handling** — try an empty prompt, or unplug your network, and watch
   the friendly error messages.

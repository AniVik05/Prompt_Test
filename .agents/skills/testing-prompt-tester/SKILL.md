---
name: testing-prompt-tester
description: Test the Prompt Tester app end-to-end. Use when verifying UI rendering, error handling, or API integration changes.
---

# Testing the Prompt Tester App

## Local Dev Setup

```bash
cd <repo_root>
npm install
cp .env.local.example .env.local
# Edit .env.local with a real GEMINI_API_KEY if testing AI generation
npm run dev
```

The dev server starts on port 8080 (or next available port like 8081 if 8080 is in use). Check terminal output for the actual port.

## Key Test Flows

### 1. UI Rendering
- Navigate to `http://localhost:<port>/`
- Verify: "Prompt Tester" heading, textarea, model selector, "Run Prompt" button
- Verify: 4 card sections (Prompt, AI Response, API Usage, Learning corner)

### 2. Client-Side Validation
- Leave prompt textarea empty, click "Run Prompt"
- Expected: Red error banner shows "Please enter a prompt."

### 3. API Key Error (without valid key)
- Type any text, click "Run Prompt"
- If no GEMINI_API_KEY set: error "Missing GEMINI_API_KEY on the server."
- If placeholder key set: error "Invalid API key detected on the server." (the `classifyApiError` utility matches the auth error pattern)

### 4. 404 Page
- Navigate to any non-existent route like `/nonexistent-page`
- Expected: "404", "Page not found", purple "Go home" button
- "Go home" should navigate back to `/`

### 5. AI Generation (requires valid GEMINI_API_KEY)
- Set real key in `.env.local`, restart dev server
- Type a prompt, click "Run Prompt"
- Expected: AI response text appears, response time shown, token usage populated

## Architecture Notes
- Server functions use TanStack Start `createServerFn` (not Express)
- API key is read server-side only via `getGeminiApiKey()` in `src/lib/api-key.server.ts`
- Error classification uses `classifyApiError()` in `src/lib/error-utils.ts`
- Shared styles in `src/lib/styles.ts`, meta constants in `src/lib/meta.ts`

## Devin Secrets Needed
- `GEMINI_API_KEY` — Required for testing the AI generation success path. Without it, you can only test error handling and UI rendering.

## Lint & Type Check
```bash
npm run lint    # ESLint + Prettier
npx tsc --noEmit  # TypeScript type checking
```

Note: There may be pre-existing prettier warnings in `src/routes/sitemap[.]xml.ts` and react-refresh warnings in UI component files — these are not test failures.

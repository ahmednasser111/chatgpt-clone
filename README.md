# ChatGPT Clone

A full-stack, single-user ChatGPT clone. Next.js App Router frontend, Route Handler backend, SQLite via Prisma, and Hugging Face Inference Providers for chat completions (streamed).

No authentication — it's a local, single-user app.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, dark mode via `.dark` class |
| Backend | Next.js Route Handlers (`src/app/api/**`) |
| AI provider | Hugging Face Inference Providers — OpenAI-compatible `router.huggingface.co/v1/chat/completions` |
| Database | SQLite + Prisma ORM (driver adapter: `@prisma/adapter-libsql`) — works against a local `file:` DB or a remote Turso/libsql DB with the same code |
| State | Zustand |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Hugging Face token:

```bash
cp .env.example .env
```

```env
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL="file:./dev.db"
```

Get an API key from https://huggingface.co/settings/tokens (a "read" token is enough for inference). The models used (`openai/gpt-oss-120b:cerebras`, etc.) are served through Hugging Face's Inference Providers, so your account needs access to at least one provider for each model — most work out of the box on the free tier with rate limits.

### 3. Set up the database

```bash
npm run db:migrate   # applies prisma/migrations, creates dev.db
```

(`npm install` also runs `prisma generate` automatically via the `postinstall` script.)

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

### Other scripts

```bash
npm run build       # production build
npm run start        # run the production build
npm run lint          # ESLint
npm run db:studio  # Prisma Studio — browse the SQLite DB
npm run db:push     # push schema changes without a migration (dev only)
```

## Project architecture

```
src/
├── app/
│   ├── api/                       # Route Handlers (backend)
│   │   ├── models/route.ts                          GET available models
│   │   └── conversations/
│   │       ├── route.ts                              GET list / POST create
│   │       └── [id]/
│   │           ├── route.ts                          GET / PATCH (rename, model) / DELETE
│   │           ├── regenerate/route.ts                POST — regenerate last assistant reply (SSE)
│   │           └── messages/
│   │               ├── route.ts                       POST — send message, streamed reply (SSE)
│   │               └── last/route.ts                   PATCH edit / DELETE last user prompt
│   ├── page.tsx                    # Single-page shell: Sidebar + ChatWindow
│   ├── layout.tsx                  # Root layout, theme init script, fonts
│   └── globals.css                 # Tailwind, theme tokens, markdown/code styles
│
├── components/                    # Small, generic, reusable UI (no feature logic)
│   ├── LoadingIndicator.tsx
│   ├── MarkdownRenderer.tsx        # react-markdown + remark-gfm + rehype-highlight
│   ├── CopyButton.tsx
│   ├── ErrorBanner.tsx
│   └── ThemeToggle.tsx
│
├── features/
│   ├── chat/
│   │   ├── components/             # ChatWindow, MessageBubble, MessageInput, ModelSelector
│   │   └── server/                 # SSE streaming + message-shape helpers used only by API routes
│   └── conversations/
│       └── components/             # Sidebar, ConversationList, ConversationItem
│
├── lib/
│   ├── ai/                         # AI service layer — the only place that knows about Hugging Face
│   │   ├── index.ts                 public API: generateResponse, streamResponse, listAvailableModels
│   │   ├── huggingface-client.ts     fetch-based client, non-streaming + SSE streaming
│   │   ├── models.ts                 the 5 supported models
│   │   ├── errors.ts                 AiServiceError + HF status-code mapping
│   │   ├── types.ts
│   │   └── sse.ts
│   ├── db/                         # Prisma-backed repository functions
│   │   ├── prisma.ts                 PrismaClient singleton (libsql driver adapter — local file or Turso)
│   │   ├── conversations.ts
│   │   └── messages.ts
│   ├── api/client.ts               # Frontend fetch client (talks to /api/**, parses SSE)
│   ├── store/chat-store.ts         # Zustand store — single source of UI truth
│   └── export-conversation.ts      # Bonus: export a conversation as JSON
│
├── hooks/                          # Thin hooks wrapping the Zustand store for components
│   ├── useInitApp.ts
│   ├── useConversations.ts
│   ├── useChat.ts
│   ├── useModels.ts
│   └── useTheme.ts
│
├── types/chat.ts                   # Shared frontend/backend types
└── prisma/
    ├── schema.prisma
    └── migrations/
```

**Why this split:** `lib/ai` never imports React or Prisma — it's a pure service layer that could be lifted into any Node backend. `lib/db` never imports Next.js request/response types. `features/*/server` is the only place that wires AI + DB together into an HTTP-streamable response, and it's only ever imported from `app/api/**`. Components under `features/*` own their domain's UI and are the only consumers of the corresponding hooks; `components/` holds primitives with no chat/conversation awareness at all.

### Data flow for a chat turn

1. `MessageInput` calls `useChat().sendMessage(text)` → Zustand action.
2. If there's no active conversation yet, the store creates one (`POST /api/conversations`) using the currently selected model.
3. `POST /api/conversations/:id/messages` saves the user message, auto-titles the conversation on the first turn, then returns a `text/event-stream` response.
4. The route builds the full message history (`lib/db/messages` → `toAiMessages`) and calls `streamResponse()` from the AI service layer, forwarding each token as an SSE `delta` event.
5. On completion, the assistant message is persisted and a `done` event is sent with the saved message's id/timestamp; the frontend appends it to `messages` and clears the streaming buffer.
6. Any Hugging Face error (bad key, rate limit, unsupported model, network) is caught and sent as an SSE `error` event so the UI can show it without breaking the stream.

### Images and files (bonus)

The `Message` table has a single `content` string column, per the required schema — no separate attachments table. Images are embedded as markdown image syntax (`![name](data:image/...;base64,...)`) so they round-trip through `content` and render inline via `MarkdownRenderer`. On the way to the model, `toAiMessages()` extracts any embedded data-URL images back out into OpenAI-style `image_url` content parts for vision-capable models (e.g. `google/gemma-3-4b-it`). Plain files are inlined as a fenced code block with the filename as a heading.

## Error handling

All API errors share a `{ error: string; code: ApiErrorPayload["code"] }` shape (`src/types/chat.ts`), with the AI layer mapping Hugging Face's HTTP status codes to it (`src/lib/ai/errors.ts`):

- `401/403` → `INVALID_API_KEY`
- `429` → `RATE_LIMITED`
- `404` → `UNSUPPORTED_MODEL`
- empty message body → `EMPTY_PROMPT` (400, checked before calling the model at all)
- `fetch` throwing → `NETWORK_ERROR`
- anything else → `UNKNOWN`, with the HF response body attached (truncated) for debugging

The frontend surfaces these via `ErrorBanner` and never crashes the chat — a failed generation just shows the error and leaves the conversation state intact so the user can retry or regenerate.

## Deploying to Vercel

Vercel's serverless functions have a read-only filesystem (except `/tmp`, which is wiped between cold starts and isn't shared across instances), so a local `dev.db` file won't persist there. The DB layer uses `@prisma/adapter-libsql`, which talks to either a local SQLite file *or* a remote [Turso](https://turso.tech) database through the same code — so deploying only means pointing `DATABASE_URL` at Turso instead of a file:

1. Create a Turso database (free tier): `turso db create chatgpt-clone`, then `turso db tokens create chatgpt-clone`.
2. Apply the existing migration to it: `turso db shell chatgpt-clone < src/prisma/migrations/*/migration.sql` (Turso isn't a local file, so `prisma migrate deploy` can't reach it directly — the migration SQL is plain SQLite DDL, so piping it in via the Turso shell is the simplest path).
3. In your Vercel project, set env vars:
   - `HF_API_KEY`
   - `DATABASE_URL` = the `libsql://...` URL from `turso db show chatgpt-clone`
   - `TURSO_AUTH_TOKEN` = the token from step 1
4. Deploy (`vercel --prod` or connect the GitHub repo). No other code changes needed — locally, leave `DATABASE_URL="file:./dev.db"` and omit `TURSO_AUTH_TOKEN`; the same `prisma.ts` handles both.

Route handlers here all use the default Node.js runtime (not Edge) since Prisma's driver adapters and SSE streaming need it — don't add `export const runtime = "edge"` to any of them.

## Notes / limitations

- Single-user, no auth — anyone with access to the running server has full access.
- No cancel/stop-generation button on streaming responses — a possible follow-up.

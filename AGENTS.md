# AGENTS.md

Personal timeline app ("时间胶囊") built with Next.js 13 (App Router) + MongoDB + Ant Design.

## Commands

```bash
pnpm install          # pnpm is the package manager (ignore README saying yarn/npm)
pnpm dev              # start dev server at localhost:3000
pnpm build            # production build
pnpm lint             # next lint
```

## Architecture

```
app/                  # Next.js App Router pages and API routes
  page.js             # → / (landing stub)
  timeline/           # → /timeline (main app: timeline CRUD)
  ip/[[...slugs]]/    # → /ip, /ip/{ip} (IP geolocation via IPify)
  json/               # → /json (embeds external JSON formatter iframe)
  api/
    qiniu/route.js    # Qiniu upload token (GET) + file delete (POST), uses QINIU_BUCKET env
    amap/sign/route.js# POST → server-side Amap signature generation (keeps private key off client)
components/timeline/  # Timeline UI components (NodeLabel, NodeChild, NewTimeLine, PWAInstallPrompt)
database/
  mongodb.js          # Mongoose connection helper (global.mongoose cache pattern)
  modules/
    TimeLineData.js       # Mongoose model: year/month/day/week/weather/content/photos/video/tags
    TimeLineDataAction.js # Server Actions (use server): CRUD for timeline entries
lib/amap.js           # Amap API helpers (amapSign / amapStaticMapUrl / amapGet)
utils.js              # PAGE_SIZE, currentDate(), splitDate() helpers
middleware.js         # Enforces Cloudflare Access auth on /timeline and /api/* routes
```

## Key Details

- **All React files use `.jsx` extension.** The project is plain JS, not TypeScript.
- **Path alias `@/*` → `./*`** (see `jsconfig.json`). Import e.g. `@/database/modules/TimeLineDataAction`.
- **MongoDB connection uses `global.mongoose` cache pattern** — safe for HMR reloads, connections are reused.
- **`.env` is gitignored now** — but it WAS committed in git history (commits up to `44e82c1`). The secrets (MongoDB password, Qiniu keys, Amap private key, IPify key) are still recoverable from history. Rotate them if the repo ever becomes public/forked.
- **Middleware** (`middleware.js`, not `.jsx`) enforces Cloudflare Access auth on `/timeline` and `/api/*` routes via `CF_Authorization` cookie. Skips in development. Validates JWT structure/expiry but NOT signature — the security assumption is Cloudflare Access sits in front of the origin.
- **IP page** returns hardcoded Beijing mock data when `NODE_ENV === "development"`.
- **Amap private key is server-side only** (`AMAP_PRIVATE_KEY`, no `NEXT_PUBLIC_` prefix). All Amap signature generation goes through `/api/amap/sign` (POST). Client code uses `lib/amap.js` helpers (`amapSign` / `amapStaticMapUrl` / `amapGet`) — do NOT hand-roll `fetch("/api/amap/sign")` again.
- **Timeline pagination is cursor-based** (`lastId` = last item's `_id`, `_id < lastId`), not `skip`-based. `PAGE_SIZE` (10) lives in `utils.js`; change it there, not in the query call.

## Style

- **Prettier**: semi, singleQuote, trailingComma: all (configured in `.vscode/settings.json` — no `.prettierrc`)
- **Indent**: 2 spaces, LF line endings (see `.editorconfig`)
- **SCSS** used for component-level styles; **Tailwind** for utility classes; **Ant Design v5** for UI primitives
- No test framework present

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo-style layout where the actual Next.js application lives in `app/`, and everything else is design documentation consumed by both humans and the AI narrator itself:

- `app/` — the Next.js 16 application (App Router), Prisma schema/migrations, Docker setup. All commands below run from here.
- `core/` — AI narrator fundamentals: data contract standards (`STANDARDS.md`), interaction modes (`INTERACTION_MODELS.md`), vision system (`VISION.md`), plus `core/models` and `core/prompts`.
- `rules/` — game mechanics and lore reference (`rules/mechanics/CORE_MECHANICS.md`, `rules/mechanics/SCENE_TAGS.md`, `rules/lore`).
- `docs/` — human-facing docs: `ARCHITECTURE.md`, `SETUP.md`, `COMMANDS.md`, `FEATURES.md`.
- `private/` — internal design notes, marketing, lore drafts; not part of the runtime.
- `tools/` — standalone debug/test scripts run outside the Next.js app (e.g. `tools/debug/`).

When changing the AI narrator's JSON contract (the `sceneSchema` in `app/src/app/api/chat/route.ts`), keep `core/STANDARDS.md` in sync — it documents the required camelCase field names the frontend depends on.

## Commands

All app commands run from the `app/` directory. The project runs inside Docker; the `Makefile` wraps `docker compose`.

### Docker lifecycle (`app/Makefile`)
- `make dev` — start the dev stack (Next.js, Postgres, MinIO) detached.
- `make dev-restart` — recreate the dev stack.
- `make dev-logs` — tail Next.js dev logs.
- `make prd` — start the production stack (builds image).
- `make down` — stop and remove all containers.
- `make status` — list running containers for this project.
- `make clean` — remove volumes/containers and prune Docker (destructive).
- `make sh-dev` / `make sh-prd` — open a shell in the app container.

### Database (Prisma, run via the dev container)
- `make prisma-gen` — regenerate the Prisma client after schema changes.
- `make prisma-migrate` — run `prisma migrate dev`.
- `make prisma-seed` — run `prisma db seed` (executes `prisma/seed.ts` via `tsx`).
- `make db-reset-dev` — wipes the dev Postgres volume, re-migrates, and reseeds (destructive; asks for confirmation before running).

### Node scripts (`app/package.json`, if running outside Docker)
- `npm run dev` — `next dev`
- `npm run build` — `next build`
- `npm run start` — `next start`
- `npm run lint` — `eslint`

There is no test runner configured in `package.json`. Ad hoc/manual test and debug scripts live in `app/prisma/check_*.ts`, `app/prisma/seed_*.ts`, and `tools/debug/`, run individually with `npx tsx <path>` (or `tsx` if installed globally).

Default dev URL: `http://localhost:25035`. MinIO console: `http://localhost:9001`.

## Architecture

### Stack
Next.js 16 (App Router) + React 19, Prisma 7 (Postgres, via `@prisma/adapter-pg`), NextAuth (JWT credentials + MFA), Zustand for client state, Tailwind 4. AI access goes through the Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`) with Google Gemini as the default provider. Assets (images/audio) are stored in MinIO (S3-compatible) via `@aws-sdk/client-s3`.

### The narrative contract
The core of the app is a single AI-driven story loop: `app/src/app/api/chat/route.ts` calls `streamObject` against a large Zod schema (`sceneSchema`) that the model must fill in for every scene — narration text, image/audio descriptions, player status deltas, inventory/skill changes, tactical combat options, puzzles, dice-roll requirements, etc. This schema is the single source of truth for what a "scene" is; the frontend (`gameStore`, `NarrativePanel`, `ActionOrchestrator`, etc.) renders purely off its shape. Conventions to preserve when touching it:
- Property names are strict camelCase, described in English, even though narration content itself is Portuguese (PT-BR) — see `core/STANDARDS.md` for the full field glossary.
- System-prompt rules embedded in that route (anti-repetition of `recommendedInputType`, dice-roll/DC logic, forced endings, scene-length pacing) implement the mechanics documented in `core/INTERACTION_MODELS.md` and `rules/mechanics/CORE_MECHANICS.md` — changes to game rules generally require touching both the prompt logic here and those docs together.
- Admin "force" controls (`forcedNextAction`, `forcedEndingType` on `gameStore`) inject `!!! REGRA ABSOLUTA !!!` overrides into the system prompt — used by the admin dashboard to script demos/tests.

### AI provider resolution (BYOK)
`app/src/lib/ai/providers.ts` (`getTextModel`, `getImageModel`, `getAIConfigMetadata`) resolves which AI provider/model/key to use per request: it prefers a player's own configured model + API key (BYOK, decrypted via `lib/security.ts`) when both are present and `apiEnabled` isn't false for that provider, otherwise falls back to the system's `.env` model + server-side key. Provider is inferred from model ID prefix (`gpt-`/`o1-`/`o3-` → openai, `claude-` → anthropic, else google). `app/src/lib/ai/discovery.ts` fetches live available models from each provider's API for the profile settings UI. Any new provider-aware feature should reuse this resolution pattern rather than reading `.env` directly.

### State and persistence layers
- **Client state:** `app/src/store/gameStore.ts` — a single Zustand store (persisted to localStorage) holding player status, inventory, scene history, theming, admin/debug toggles, and impersonation (admin "supervision mode"). This is the primary state hub most game components read/write.
- **Server state:** Prisma models in `app/prisma/schema.prisma` — `Player` (auth, BYOK keys, MFA, themes, usage stats), `Journey` (one playthrough: history/flags/settings JSON blobs plus "final" snapshot fields written at game-over), `Scene` (persisted per-scene record mirroring the `sceneSchema` shape), `Asset` (generated image/audio references in MinIO). Most gameplay fields are loosely-typed `Json` columns rather than normalized relations — expect to parse/shape JSON on both read and write.
- **Auth:** NextAuth credentials provider (`app/src/lib/auth.ts`) with bcrypt password hashing, optional TOTP MFA (`app/src/lib/security.ts`), and an `accountStatus` gate (`PENDING`/`ACTIVE`) enforced both in `authorize()` and in `app/src/middleware.ts`. Route protection (auth required, `/admin/*` requires `role === "ADMIN"`) is centralized in the middleware matcher, not per-route checks.
- **Secrets:** user-supplied API keys and MFA secrets are AES-256-CBC encrypted at rest via `encrypt`/`decrypt` in `lib/security.ts`, decrypted only in-memory when calling out to an AI provider.

### Assets and export
Images (DALL-E / Imagen) and audio (OpenAI TTS / Gemini Audio) generated per-scene are uploaded to MinIO and referenced by URL on the `Scene`/`Asset` records; `app/src/app/api/assets/[...path]/route.ts` proxies/serves them. End-of-journey PDF export ("The Legend's Book") is built client-side via `jspdf`/`html2canvas` (`lib/pdfUtils.ts`, `lib/exportUtils.ts`) in both an illustrated and text-only mode, with a hash-based cache (`lastPdfHash`/`lastTextPdfHash` on `Journey`) to avoid regenerating unchanged exports.

### Game mechanics reflected in the schema
These rules (documented in `rules/mechanics/CORE_MECHANICS.md`, `rules/mechanics/SCENE_TAGS.md`) drive specific `sceneSchema` fields and frontend panels — keep them in sync if you touch either side:
- **Reputation (Karma vs. local reputation):** `status.moral` is the single Global Karma value; `statusChanges.reputations` / `worldUpdate.reputations` are a `Record<entityName, delta>` for NPCs/factions/places. The AI must name the specific entity (e.g. `"Guilda dos Ferreiros": +2`) rather than only adjusting global moral. `InfluencePanel.tsx` reads `status.reputations` and buckets entries into people/places/factions by keyword-matching the name (e.g. `vila`/`cidade`/`reino` → places, `guilda`/`ordem`/`facção` → factions) — new reputation entities should use names that sort correctly under that heuristic.
- **Status log (battle diary):** every HP/SP change should carry a declared source (`statusChanges.hpSource` / `spSource`, e.g. `"Garras do Lobo"`, `"Poção"`). These are persisted into `gameStore.statusHistory` and rendered by `StatusLogPanel.tsx` (filtered by `type: 'hp' | 'sp'`) — an HP/SP delta with no source degrades that panel.
- **Real-time feedback:** item gains/losses, skill-ups, and moral milestones are surfaced via Sonner toasts (`toast.success/error/warning`, see `ActionOrchestrator.tsx`, `InquiryPanel.tsx`) rather than inline UI state — follow that pattern for new player-facing events instead of adding bespoke banners.
- **Vitals/inventory caps:** HP 0–20, SP 0–15 (`gameStore.initialStatus`); inventory capped at `INVENTORY_CAPACITY = 10`, spectral (vision-acquired) items capped separately at `SPECTRAL_CAPACITY = 3`; equipment `durability` reaching 0 breaks the item.
- **Permadeath modes:** journeys can run "Tolerante" (AI forgives failures) or true "Morte Permanente" (a `finalStatus`/game-over locks the journey from re-entry) — this is a per-journey `settings` choice, not a global config.

### Dev workflow note: client state drift
When making structural changes to `gameStore.ts` (renaming/removing persisted fields), old localStorage state under the `fantasy-portal-storage` key can desync from the new shape and break the UI. `MainMenu.tsx` exposes a "Limpar Cache Local" action (`localStorage.removeItem('fantasy-portal-storage')` + reload) for exactly this — mention it to the user (or trigger it) after landing breaking `gameStore` changes, since server-side journeys are unaffected and safe.

### Localization convention
Backend code, JSON schema field names, and log messages are in English. All narrative content and user-facing frontend text are in Portuguese (PT-BR). Keep this split when adding new schema fields or UI strings.

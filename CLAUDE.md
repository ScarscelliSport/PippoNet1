# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Gestionale Forniture - Errea & Solo: a small business-management app (in Italian) for tracking sportswear supply orders to sports clubs. It manages clients (clienti), orders/restocks (ordini), printing/embroidery jobs (lavorazioni), payments (pagamenti), documents (documenti), and seasonal kit campaigns with per-athlete sizing (kit / ragazzi). It includes BRUNO, an integrated AI assistant that can look things up in the database.

The UI, domain model, and all user-facing text are in Italian — keep new code, labels, and comments consistent with that (variable/field names like `cliente`, `ordine`, `importoTotale` are the domain vocabulary, not to be translated).

## Commands

```bash
npm run dev          # start dev server (http://localhost:3000)
npm run build        # production build
npm run start        # run production build
npm run lint         # eslint
npm run db:migrate   # prisma migrate dev (creates/applies migrations)
npm run db:studio    # Prisma Studio to inspect the SQLite DB
```

Setup from scratch: `npm install`, `cp .env.example .env`, `npx prisma migrate dev`.

There is no test suite in this repo.

`postinstall` runs `prisma generate` automatically after `npm install`.

## Environment

- `DATABASE_URL` — SQLite file path (e.g. `file:./prisma/dev.db`).
- `ANTHROPIC_API_KEY` — optional; enables BRUNO's real AI responses. Without it, BRUNO falls back to rule-based/keyword responses (see `lib/bruno-rules.ts`) so the app is fully usable without a key.

## Architecture

**Stack**: Next.js App Router + TypeScript + Tailwind CSS v4, Prisma 7 with the `better-sqlite3` driver adapter, Zod for form validation. There is no separate REST API for writes — all mutations go through Next.js Server Actions.

### Data flow pattern

Every domain area under `app/<area>/` follows the same shape:
- `page.tsx` (and `[id]/page.tsx`) — server components that query Prisma directly and render data.
- `actions.ts` — `"use server"` file with the Zod schema, a `parseX(formData)` helper, and exported `createX`/`updateX`/`deleteX` functions. Actions call `revalidatePath` for every affected route and `redirect` after create/update/delete.
- Matching form component in `components/` (e.g. `ClienteForm.tsx`, `OrdineForm.tsx`) that posts a `<form action={...}>` to the server action.

When adding a new mutation, follow this same trio (schema in `actions.ts` → form component → page) rather than introducing an API route.

### Prisma / database

- Schema: `prisma/schema.prisma`. Generated client output is `app/generated/prisma` (imported as `@/app/generated/prisma/client`), **not** the default `node_modules/.prisma` location — always import types/enums from there.
- Singleton client in `lib/prisma.ts` (cached on `globalThis` in dev to survive HMR).
- SQLite has no native enums/booleans in the driver sense; Prisma enums (`Brand`, `StatoConsegna`, `KitStato`, etc.) are the source of truth for domain states.
- Payment/delivery status is **derived, not stored**: `statoPagamentoOrdine()` in `lib/labels.ts` computes NON_PAGATO/PARZIALE/PAGATO from `importoTotale` vs. the sum of related `Pagamento.importo` — always recompute from payments rather than trusting a stored field.
- Migrations live in `prisma/migrations/`; run `npm run db:migrate` to create a new one after schema changes.

### Domain model relationships

- `Cliente` (sports club) → has many `Ordine`, `Documento`, `Kit`, `Ragazzo`.
- `Ordine` (order or restock, brand ERREA/SOLO) → has many `Lavorazione` (print/embroidery cost, tracked separately from the invoiced amount) and `Pagamento`; optionally linked to a `Ragazzo` and to one `KitAtleta`.
- `Kit` (a seasonal product campaign for a client) → has `KitProdotto` (products with sizes) and `KitAtleta` (join of a `Ragazzo` to the kit).
- `Ragazzo` (athlete) belongs to a `Cliente`, can participate in multiple `Kit` over time via `KitAtleta`, and has personal `Ordine`s — each athlete/family pays their own order, distinct from other athletes in the same kit.
- `KitTaglia` records the size chosen per product per `KitAtleta` (unique on `[kitAtletaId, kitProdottoId]`).

### Shared conventions in `lib/`

- `lib/labels.ts` — the single source of truth for enum → Italian label mappings, Tailwind color classes per status, and formatters (`formatEuro`, `formatData`, `formatDataInput`, `formatBytes`). Add new enum values here, not inline in components.
- `lib/ui.ts` — shared Tailwind class strings for inputs/buttons (`inputClass`, `buttonClass`, `buttonSecondaryClass`, `buttonDangerClass`); reuse these instead of re-writing className strings on new form elements.
- `lib/search.ts` — `searchAll()` (clienti/ordini/lavorazioni/documenti/ragazzi) and `searchKit()`. Kit search is intentionally kept separate from the general search — don't merge their results.
- `lib/export.ts`, `lib/report.ts` — Excel export (`xlsx`) and the forniture report used by `app/report`.

### BRUNO (AI assistant)

- `app/api/bruno/route.ts` — POST endpoint. If `ANTHROPIC_API_KEY` is set, runs an agentic tool-use loop (max 5 turns) against the Claude API using the tools in `lib/bruno-tools.ts`; otherwise delegates to `lib/bruno-rules.ts` for keyword-based answers.
- `lib/bruno-tools.ts` — defines the tool schemas (`cerca_nel_programma`, `cerca_kit`, `dettagli_cliente`, `dettagli_ordine`, `dettagli_ragazzo`, `statistiche_generali`) and `eseguiBrunoTool()` that executes them against Prisma. When adding a new BRUNO capability, add both a tool definition here and a matching branch in the no-AI fallback in `bruno-rules.ts` so the assistant keeps working without an API key.
- `components/Bruno.tsx` — floating chat widget, calls `app/api/bruno`.

### Path aliases

`@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/lib/prisma`, `@/components/Nav`.

### Windows desktop shortcut

`crea-icona-desktop.bat`/`.ps1` and `avvia-gestionale.bat` are end-user convenience scripts to create a Desktop shortcut that starts the dev server and opens the browser on Windows — unrelated to the Next.js app's own build/runtime.

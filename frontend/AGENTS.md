# frontend/AGENTS.md

## Stack
React 19 + TypeScript + MUI, TanStack Query for data, react-router-dom for routing, `pnpm` scripts.

## Structure
- `src/api/client.ts` — all API calls, types, and shared hooks (e.g. `useActiveEventId`). Add new endpoints here, not ad-hoc fetches.
- `src/pages/` — route-level pages
- `src/components/` — shared components; `layout/` for shell/panel/menu, `ui/` for generic dialogs (e.g. `DetailDialog`)

## Rules
- Reuse existing components/dialogs (`DetailDialog`, `Panel`, etc.) before building new ones.
- Follow existing MUI `sx` styling conventions; no CSS frameworks.
- Keep API calls in `client.ts`; never duplicate backend validation.
- Persist UI state via `localStorage` (settings) or module-level vars (session-only, e.g. search text) — match existing patterns in `client.ts`/`StaffSidebarList.tsx`.

## Before coding
1. Find similar existing UI/pattern and reuse it.
2. Implement only what's requested.
3. Run `pnpm build` (runs `tsc -b` + vite build) to verify.
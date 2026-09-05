# Project Rules

Monorepo: `backend/` (Django REST API) + `frontend/` (React/TS/MUI). See each dir's AGENTS.md for specifics.

## Architecture
- Backend owns all business logic; frontend never duplicates validation/rules.
- API contracts (serializers) are the source of truth for both sides.

## General
- Reuse existing code/components over adding abstractions or dependencies.
- Keep changes minimal, localized, and scoped to the request.
- Run relevant tests/type checks after changes (see sub-AGENTS.md for commands).

## Git
- Don't touch unrelated files.
- Don't commit unless asked.
# backend/AGENTS.md

## Stack
Django + Django REST Framework, SQLite (`db.sqlite3`), Django's built-in test runner (no pytest).

## Apps
`accounts`, `scheduling`, `staffing`, `availability`, `common` — each with `models.py`, `serializers.py`, `views.py`, `permissions.py`, `tests.py`. No separate `services/`/`selectors/` layers; business logic lives in views/serializers per app.

## Rules
- Reuse existing serializers/permissions before adding new ones.
- Never change API response shapes without checking frontend usage in `frontend/src/api/client.ts`.
- Add/update tests in the relevant app's `tests.py` for behavioral changes.
- Use the correct permission class: `IsGlobalManager` for mutating-only endpoints, `IsGlobalManagerOrReadOnly` only when a GET path also needs protecting.

## Test command
```
DJANGO_SECRET_KEY="test-secret-key" ./.venv/bin/python manage.py test accounts scheduling staffing availability
```
(must list apps explicitly; bare `manage.py test` runs 0 tests)

## Before coding
1. Find the existing pattern in the target app.
2. Make the smallest change.
3. Run the test command above.
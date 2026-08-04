# backend/scheduling/public_tokens.py
from __future__ import annotations

from typing import Any
from uuid import UUID

from django.conf import settings
from django.core import signing

TOKEN_SCOPE = "public_event_access"
TOKEN_SALT = "scheduling.public_event_access"

# Default: 8 hours
TOKEN_MAX_AGE_SECONDS = getattr(settings, "PUBLIC_EVENT_TOKEN_MAX_AGE_SECONDS", 8 * 60 * 60)


def issue_public_event_token(event_public_id: UUID | str) -> str:
    payload = {
        "scope": TOKEN_SCOPE,
        "event_public_id": str(event_public_id),
    }
    return signing.dumps(payload, salt=TOKEN_SALT)


def verify_public_event_token(token: str) -> dict[str, Any] | None:
    try:
        payload = signing.loads(
            token,
            salt=TOKEN_SALT,
            max_age=TOKEN_MAX_AGE_SECONDS,
        )
    except signing.BadSignature:
        return None
    except signing.SignatureExpired:
        return None

    if payload.get("scope") != TOKEN_SCOPE:
        return None

    event_public_id = payload.get("event_public_id")
    if not event_public_id:
        return None

    # Ensure it is a valid UUID
    try:
        UUID(str(event_public_id))
    except ValueError:
        return None

    return payload

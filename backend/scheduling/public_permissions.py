# backend/scheduling/public_permissions.py
from rest_framework.permissions import BasePermission

from .public_tokens import verify_public_event_token


class HasPublicEventAccess(BasePermission):
    message = "A valid public event access token is required."

    def has_permission(self, request, view):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return False

        token = auth_header.removeprefix("Bearer ").strip()
        if not token:
            return False

        claims = verify_public_event_token(token)
        if not claims:
            return False

        url_event_public_id = str(view.kwargs.get("event_public_id", ""))
        token_event_public_id = str(claims.get("event_public_id", ""))

        if not url_event_public_id or token_event_public_id != url_event_public_id:
            return False

        request.public_event_claims = claims
        return True

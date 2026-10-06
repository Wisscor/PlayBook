"""Cursor helpers for keyset pagination (shared by the list endpoints).

A cursor is the (timestamp, id) of the last row of the previous page,
encoded as an opaque base64 string.
"""

import base64
import json
import uuid
from datetime import datetime

from fastapi import HTTPException, status


def encode_cursor(ts: datetime, row_id: uuid.UUID) -> str:
    raw = json.dumps({"t": ts.isoformat(), "id": str(row_id)})
    return base64.urlsafe_b64encode(raw.encode()).decode()


def decode_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    try:
        data = json.loads(base64.urlsafe_b64decode(cursor.encode()))
        return datetime.fromisoformat(data["t"]), uuid.UUID(data["id"])
    except (ValueError, KeyError, TypeError):
        raise HTTPException(422, detail="Invalid cursor")

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from ua_parser import parse

from ..models import Session
from ..core.config import settings


async def create_session_service(
    db: AsyncSession,
    user_id: UUID,
    request: Request,
) -> Session:
    ua_data = parse(request.headers.get("user-agent") or "")

    new_session = Session(
        id=uuid4(),
        user_id=user_id,
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=settings.session_expire_days),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        platform=ua_data.os.family if ua_data.os else None,
        browser=ua_data.user_agent.family if ua_data.user_agent else None,
    )
    db.add(new_session)
    await db.commit()
    return new_session

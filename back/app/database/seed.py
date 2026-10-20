"""Seed the sports table. Safe to run many times (only missing sports are added).

To add a sport later, add it to SPORTS and restart the API.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sport import Sport

SPORTS = {
    "Football": 11,
    "Volleyball": 6,
    "Basketball": 5,
}


async def seed_sports(db: AsyncSession) -> None:
    existing = set((await db.scalars(select(Sport.name))).all())
    db.add_all(
        Sport(name=name, max_players=max_players)
        for name, max_players in SPORTS.items()
        if name not in existing
    )
    await db.commit()

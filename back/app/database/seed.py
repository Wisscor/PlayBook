"""Seed the sports table. Safe to run many times (only missing sports are added).

Run:  python -m app.database.seed
To add a sport later, add it to SPORTS and run the script again.
"""

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.models.sport import Sport

SPORTS = ["Football", "Volleyball", "Basketball"]


async def seed_sports(db: AsyncSession) -> None:
    existing = set((await db.scalars(select(Sport.name))).all())
    db.add_all(Sport(name=name) for name in SPORTS if name not in existing)
    await db.commit()


async def main() -> None:
    async for db in get_db():  # reuses your get_db, no session factory needed
        await seed_sports(db)


if __name__ == "__main__":
    asyncio.run(main())

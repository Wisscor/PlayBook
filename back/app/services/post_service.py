from collections.abc import Sequence
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Post, User
from ..schemas.post import PostResponse
from ..schemas.user import UserSummaryResponse


async def enrich_posts(
    posts: Sequence[Post],
    current_user: Optional[User],
    db: AsyncSession,
) -> List[PostResponse]:
    """Build post responses with author summaries."""
    if not posts:
        return []

    responses = []
    for post in posts:
        user_summary = None
        if post.user:
            user_summary = UserSummaryResponse(
                id=post.user.id,
                username=post.user.username,
                firstname=post.user.firstname,
                lastname=post.user.lastname,
                avatar=post.user.avatar,
            )

        responses.append(
            PostResponse(
                id=post.id,
                user_id=post.user_id,
                author=user_summary,
                caption=post.caption,
                created_at=post.created_at,
                updated_at=post.updated_at,
            )
        )

    return responses

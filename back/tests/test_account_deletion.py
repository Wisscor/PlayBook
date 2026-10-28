import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, delete, event, select
from sqlalchemy.orm import Session

from app.database.base import Base
from app.models import Follower, Post, User
from app.models import Session as LoginSession
from app.realtime.models import (
    Conversation,
    ConversationParticipant,
    Message,
    Notification,
    PendingMessage,
)
from app.realtime.services.conversations import delete_user_conversations


@pytest.mark.parametrize("deleted_index", [0, 1])
@pytest.mark.parametrize("rollback", [False, True])
def test_account_deletion_cascades_without_removing_unrelated_data(deleted_index, rollback):
    engine = create_engine("sqlite://")

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    user_ids = [uuid4() for _ in range(3)]
    conversation_ids = [uuid4(), uuid4()]
    message_ids = [uuid4(), uuid4(), uuid4()]
    with Session(engine) as db:
        db.add_all([
            User(id=user_id, username=f"user{i}", email=f"user{i}@example.com", hashed_password="hash")
            for i, user_id in enumerate(user_ids)
        ])
        db.flush()
        db.add_all([Conversation(id=cid) for cid in conversation_ids])
        db.flush()
        # The first two users share a conversation; the third has separate history.
        db.add_all([
            ConversationParticipant(conversation_id=conversation_ids[0], user_id=uid)
            for uid in user_ids[:2]
        ] + [ConversationParticipant(conversation_id=conversation_ids[1], user_id=user_ids[2])])
        db.add_all([
            Message(id=message_ids[i], conversation_id=conversation_ids[0 if i < 2 else 1],
                    sender_id=user_ids[i], body="hello")
            for i in range(3)
        ])
        db.flush()
        db.add_all([
            PendingMessage(message_id=message_ids[i], user_id=user_ids[1 - i if i < 2 else 2])
            for i in range(3)
        ])
        db.add_all([
            Notification(user_id=user_ids[1], actor_id=user_ids[0], event_type="follow"),
            Notification(user_id=user_ids[0], actor_id=user_ids[1], event_type="follow"),
            Notification(user_id=user_ids[2], actor_id=user_ids[2], event_type="follow"),
        ])
        db.add_all([Post(user_id=uid, caption="post") for uid in user_ids])
        db.add_all([
            LoginSession(user_id=uid, expires_at=datetime.now(timezone.utc) + timedelta(days=1))
            for uid in user_ids
        ])
        db.add(Follower(follower_id=user_ids[0], following_id=user_ids[1]))
        db.commit()

        # Execute the async helper's SQL against a real database with FK enforcement.
        adapter = AsyncMock()
        adapter.execute.side_effect = db.execute
        deleted_id = user_ids[deleted_index]
        asyncio.run(delete_user_conversations(adapter, deleted_id))
        db.execute(delete(User).where(User.id == deleted_id))
        if rollback:
            db.rollback()
            assert set(db.scalars(select(User.id))) == set(user_ids)
            assert set(db.scalars(select(Conversation.id))) == set(conversation_ids)
            assert set(db.scalars(select(Message.id))) == set(message_ids)
            assert len(db.scalars(select(Notification)).all()) == 3
        else:
            db.commit()
            assert set(db.scalars(select(User.id))) == set(user_ids) - {deleted_id}
            assert list(db.scalars(select(Conversation.id))) == conversation_ids[1:]
            assert list(db.scalars(select(Message.id))) == message_ids[2:]
            assert list(db.scalars(select(ConversationParticipant.user_id))) == user_ids[2:]
            assert list(db.scalars(select(PendingMessage.message_id))) == message_ids[2:]
            assert list(db.scalars(select(Notification.user_id))) == user_ids[2:]
            assert list(db.scalars(select(Follower))) == []
            for model in (Post, LoginSession):
                assert set(db.scalars(select(model.user_id))) == set(user_ids) - {deleted_id}
    engine.dispose()

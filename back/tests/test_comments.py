import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.models import Comment, Post


def _make_comment(
    user_id: uuid.UUID,
    post_id: uuid.UUID,
    content: str = "Test comment",
    reply_to_id: uuid.UUID = None,
    post: Post = None,
):
    c = Comment(
        id=uuid.uuid4(),
        user_id=user_id,
        post_id=post_id,
        content=content,
        comment_reply_to_id=reply_to_id,
        created_at=datetime.now(timezone.utc),
    )
    c.user = None
    c.post = post
    return c


def test_create_comment_success(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    loaded_comment = _make_comment(mock_user_1.id, mock_post.id, content="Great workout!")
    mock_db.scalar.side_effect = [mock_post, loaded_comment]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"content": "Great workout!"}
    res = client.post(f"/posts/{mock_post.id}/comments", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["content"] == "Great workout!"
    assert data["post_id"] == str(mock_post.id)
    assert data["user_id"] == str(mock_user_1.id)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_create_comment_reply_success(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    parent_comment = _make_comment(mock_user_1.id, mock_post.id, content="Root comment")
    reply_comment = _make_comment(
        mock_user_1.id,
        mock_post.id,
        content="Reply comment",
        reply_to_id=parent_comment.id,
    )
    mock_db.scalar.side_effect = [mock_post, parent_comment, reply_comment]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "content": "Reply comment",
        "comment_reply_to_id": str(parent_comment.id),
    }
    res = client.post(f"/posts/{mock_post.id}/comments", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["comment_reply_to_id"] == str(parent_comment.id)
    assert data["content"] == "Reply comment"

    app.dependency_overrides.clear()


def test_create_comment_post_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.post(f"/posts/{random_id}/comments", json={"content": "Hello"})
    assert res.status_code == 404
    assert "post not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_create_comment_parent_not_found(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    # 1. target post -> mock_post
    # 2. parent comment -> None
    mock_db.scalar.side_effect = [mock_post, None]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "content": "Invalid reply",
        "comment_reply_to_id": str(uuid.uuid4()),
    }
    res = client.post(f"/posts/{mock_post.id}/comments", json=payload)
    assert res.status_code == 404
    assert "parent comment not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_create_comment_parent_post_mismatch(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    other_post_id = uuid.uuid4()
    parent_on_other_post = _make_comment(mock_user_1.id, other_post_id, content="Other post comment")
    mock_db.scalar.side_effect = [mock_post, parent_on_other_post]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "content": "Mismatched reply",
        "comment_reply_to_id": str(parent_on_other_post.id),
    }
    res = client.post(f"/posts/{mock_post.id}/comments", json=payload)
    assert res.status_code == 400
    assert "does not belong" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_create_comment_validation_empty_content(mock_user_1, mock_post):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    res = client.post(f"/posts/{mock_post.id}/comments", json={"content": ""})
    assert res.status_code == 422

    app.dependency_overrides.clear()


def test_get_post_comments_success(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    c1 = _make_comment(mock_user_1.id, mock_post.id, content="First comment")
    c2 = _make_comment(mock_user_1.id, mock_post.id, content="Second comment")

    mock_db.scalar.return_value = mock_post
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [c1, c2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/posts/{mock_post.id}/comments")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["content"] == "First comment"
    assert data[1]["content"] == "Second comment"

    app.dependency_overrides.clear()


def test_get_post_comments_post_not_found(mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.get(f"/posts/{random_id}/comments")
    assert res.status_code == 404
    assert "post not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_update_comment_success(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    comment = _make_comment(mock_user_1.id, mock_post.id, content="Original content")
    mock_db.scalar.return_value = comment

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.patch(f"/comments/{comment.id}", json={"content": "Updated content"})
    assert res.status_code == 200
    assert comment.content == "Updated content"
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_update_comment_forbidden_for_non_author(mock_user_1, mock_user_2, mock_post, mock_db):
    client = TestClient(app)

    # Comment authored by mock_user_1, but caller is mock_user_2
    comment = _make_comment(mock_user_1.id, mock_post.id, content="Original")
    mock_db.scalar.return_value = comment

    app.dependency_overrides[get_curr_user] = lambda: mock_user_2
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.patch(f"/comments/{comment.id}", json={"content": "Hacked content"})
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_update_comment_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.patch(f"/comments/{random_id}", json={"content": "New content"})
    assert res.status_code == 404
    assert "comment not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_delete_comment_by_comment_author(mock_user_1, mock_post, mock_db):
    client = TestClient(app)

    comment = _make_comment(mock_user_1.id, mock_post.id, content="To delete", post=mock_post)
    mock_db.scalar.return_value = comment

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/comments/{comment.id}")
    assert res.status_code == 204
    mock_db.delete.assert_called_once_with(comment)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_delete_comment_by_post_author(mock_user_1, mock_user_2, mock_post, mock_db):
    client = TestClient(app)

    # Comment authored by mock_user_2 on mock_user_1's post.
    # mock_user_1 is the post owner and can moderate/delete it.
    comment = _make_comment(mock_user_2.id, mock_post.id, content="Spam comment", post=mock_post)
    mock_db.scalar.return_value = comment

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/comments/{comment.id}")
    assert res.status_code == 204
    mock_db.delete.assert_called_once_with(comment)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_delete_comment_forbidden_for_stranger(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    other_user_id = uuid.uuid4()
    other_post = Post(id=uuid.uuid4(), user_id=other_user_id, caption="Other")
    comment = _make_comment(other_user_id, other_post.id, content="Stranger comment", post=other_post)
    mock_db.scalar.return_value = comment

    # Caller is mock_user_1, who is neither comment author nor post author
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/comments/{comment.id}")
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_delete_comment_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.delete(f"/comments/{random_id}")
    assert res.status_code == 404
    assert "comment not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


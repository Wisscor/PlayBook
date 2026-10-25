import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.models import Post, User


def _make_post(user: User, caption: str = "Test post"):
    p = Post(
        id=uuid.uuid4(),
        user_id=user.id,
        caption=caption,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    p.user = user
    return p


def test_create_post_success(mock_user_1, mock_db):
    client = TestClient(app)

    created_post = _make_post(mock_user_1, caption="Hello world!")
    mock_db.scalar.return_value = created_post
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = []
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"caption": "Hello world!"}
    res = client.post("/posts", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["caption"] == "Hello world!"
    assert data["user_id"] == str(mock_user_1.id)
    assert data["author"]["username"] == mock_user_1.username
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_create_post_notifies_followers(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)
    created_post = _make_post(mock_user_1, caption="Hello followers!")
    mock_db.scalar.return_value = created_post
    async def assign_post_id_on_flush():
        mock_db.add.call_args.args[0].id = created_post.id

    mock_db.flush.side_effect = assign_post_id_on_flush
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_user_2.id]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch(
        "app.routers.post.emit_notifications", new_callable=AsyncMock
    ) as emit_notifications:
        res = client.post("/posts", json={"caption": "Hello followers!"})

    assert res.status_code == 201
    emit_notifications.assert_awaited_once_with(
        event_type="post_created",
        actor_id=mock_user_1.id,
        target_user_ids=[mock_user_2.id],
        target_id=created_post.id,
    )
    app.dependency_overrides.clear()


def test_create_post_validation_empty_caption(mock_user_1):
    client = TestClient(app)
    app.dependency_overrides[get_curr_user] = lambda: mock_user_1

    res = client.post("/posts", json={"caption": ""})
    assert res.status_code == 422

    app.dependency_overrides.clear()


def test_create_post_unauthenticated():
    client = TestClient(app)
    res = client.post("/posts", json={"caption": "Unauthorized post"})
    assert res.status_code == 401


def test_list_posts_success(mock_user_1, mock_db):
    client = TestClient(app)

    p1 = _make_post(mock_user_1, caption="Post 1")
    p2 = _make_post(mock_user_1, caption="Post 2")

    posts_res = MagicMock()
    posts_res.scalars.return_value.all.return_value = [p1, p2]

    mock_db.execute.side_effect = [posts_res]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/posts")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["caption"] == "Post 1"
    assert data[1]["caption"] == "Post 2"

    app.dependency_overrides.clear()


def test_list_posts_with_user_filter(mock_user_1, mock_db):
    client = TestClient(app)

    p1 = _make_post(mock_user_1, caption="Filtered post")
    posts_res = MagicMock()
    posts_res.scalars.return_value.all.return_value = [p1]

    mock_db.execute.side_effect = [posts_res]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/posts?user_id={mock_user_1.id}")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["caption"] == "Filtered post"

    app.dependency_overrides.clear()


def test_list_posts_pagination(mock_user_1, mock_db):
    client = TestClient(app)

    posts_res = MagicMock()
    posts_res.scalars.return_value.all.return_value = []
    mock_db.execute.side_effect = [posts_res]

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/posts?limit=10&offset=20")
    assert res.status_code == 200
    assert res.json() == []

    app.dependency_overrides.clear()


def test_get_post_by_id_success(mock_user_1, mock_db):
    client = TestClient(app)

    post = _make_post(mock_user_1, caption="Specific post")
    mock_db.scalar.return_value = post

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/posts/{post.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(post.id)
    assert data["caption"] == "Specific post"

    app.dependency_overrides.clear()


def test_get_post_by_id_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.get(f"/posts/{random_id}")
    assert res.status_code == 404
    assert "post not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_update_post_success(mock_user_1, mock_db):
    client = TestClient(app)

    post = _make_post(mock_user_1, caption="Original caption")
    mock_db.scalar.return_value = post

    async def mock_refresh(instance):
        pass

    mock_db.refresh.side_effect = mock_refresh

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"caption": "Updated caption!"}
    res = client.patch(f"/posts/{post.id}", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["caption"] == "Updated caption!"
    assert post.caption == "Updated caption!"
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_update_post_forbidden_for_non_author(
    mock_user_1, mock_user_2, mock_db
):
    client = TestClient(app)

    # Post owned by mock_user_1, but caller is mock_user_2
    post = _make_post(mock_user_1, caption="Original caption")
    mock_db.scalar.return_value = post

    app.dependency_overrides[get_curr_user] = lambda: mock_user_2
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.patch(f"/posts/{post.id}", json={"caption": "Hacked caption"})
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_update_post_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.patch(f"/posts/{random_id}", json={"caption": "New caption"})
    assert res.status_code == 404
    assert "post not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_delete_post_success(mock_user_1, mock_db):
    client = TestClient(app)

    post = _make_post(mock_user_1, caption="To be deleted")
    mock_db.scalar.return_value = post

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/posts/{post.id}")
    assert res.status_code == 204
    mock_db.delete.assert_called_once_with(post)
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_delete_post_forbidden_for_non_author(
    mock_user_1, mock_user_2, mock_db
):
    client = TestClient(app)

    post = _make_post(mock_user_1, caption="Protected post")
    mock_db.scalar.return_value = post

    app.dependency_overrides[get_curr_user] = lambda: mock_user_2
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.delete(f"/posts/{post.id}")
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_delete_post_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.scalar.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    random_id = uuid.uuid4()
    res = client.delete(f"/posts/{random_id}")
    assert res.status_code == 404
    assert "post not found" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_get_feed_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    post1 = _make_post(mock_user_2, caption="Friend's post")
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [post1]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/feed")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) == 1
    assert data["next_offset"] is None
    assert data["items"][0]["author"]["username"] == mock_user_2.username

    app.dependency_overrides.clear()


def test_get_feed_pagination(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    post1 = _make_post(mock_user_2, caption="First post")
    post2 = _make_post(mock_user_2, caption="Second post")

    # limit=1, returning 2 items triggers next_offset
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [post1, post2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/feed?limit=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["next_offset"] == 1

    app.dependency_overrides.clear()


def test_get_feed_with_offset(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    post = _make_post(mock_user_2, caption="Feed post")
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [post]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/feed?offset=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1

    app.dependency_overrides.clear()


def test_list_user_posts_success(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    post = _make_post(mock_user_2, caption="User's post")
    mock_db.get.return_value = mock_user_2

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [post]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{mock_user_2.id}/posts")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["caption"] == "User's post"
    assert data["items"][0]["author"]["id"] == str(mock_user_2.id)

    app.dependency_overrides.clear()


def test_list_user_posts_pagination(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    post1 = _make_post(mock_user_2, caption="Post 1")
    post2 = _make_post(mock_user_2, caption="Post 2")
    mock_db.get.return_value = mock_user_2

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [post1, post2]
    mock_db.scalars.return_value = mock_scalars

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{mock_user_2.id}/posts?limit=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["next_offset"] == 1

    app.dependency_overrides.clear()


def test_list_user_posts_not_found(mock_user_1, mock_db):
    client = TestClient(app)
    mock_db.get.return_value = None

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{uuid.uuid4()}/posts")
    assert res.status_code == 404
    assert res.json()["detail"] == "User not found."

    app.dependency_overrides.clear()

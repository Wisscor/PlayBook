import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.core.deps import get_curr_user
from app.core.pagination import encode_cursor
from app.models import Post, PostMedia, User


def _make_post(user: User, caption: str = "Test post", media_items=None):
    p = Post(
        id=uuid.uuid4(),
        user_id=user.id,
        caption=caption,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    p.user = user
    p.media = media_items or []
    return p


def _mock_enrich_exec(
    mock_db, likes_map=None, comments_map=None, user_liked_ids=None
):
    likes_res = MagicMock()
    likes_res.all.return_value = list((likes_map or {}).items())

    comments_res = MagicMock()
    comments_res.all.return_value = list((comments_map or {}).items())

    user_likes_res = MagicMock()
    user_likes_res.scalars.return_value.all.return_value = user_liked_ids or []

    return [likes_res, comments_res, user_likes_res]


def test_create_post_success(mock_user_1, mock_db):
    client = TestClient(app)

    created_post = _make_post(mock_user_1, caption="Hello world!")
    mock_db.scalar.return_value = created_post

    enrich_execs = _mock_enrich_exec(mock_db)
    mock_db.execute.side_effect = enrich_execs

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {"caption": "Hello world!"}
    res = client.post("/posts", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["caption"] == "Hello world!"
    assert data["user_id"] == str(mock_user_1.id)
    assert data["user"]["username"] == mock_user_1.username
    mock_db.commit.assert_called_once()

    app.dependency_overrides.clear()


def test_create_post_with_media(mock_user_1, mock_db):
    client = TestClient(app)

    post_id = uuid.uuid4()
    media_item = PostMedia(
        id=uuid.uuid4(),
        post_id=post_id,
        media_url="https://example.com/img1.png",
        media_type="image",
        position=0,
    )
    created_post = _make_post(
        mock_user_1, caption="Post with media", media_items=[media_item]
    )
    created_post.id = post_id
    mock_db.scalar.return_value = created_post

    enrich_execs = _mock_enrich_exec(mock_db)
    mock_db.execute.side_effect = enrich_execs

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "caption": "Post with media",
        "media": [
            {
                "media_url": "https://example.com/img1.png",
                "media_type": "image",
                "position": 0,
            }
        ],
    }
    res = client.post("/posts", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["caption"] == "Post with media"
    assert len(data["media"]) == 1
    assert data["media"][0]["media_url"] == "https://example.com/img1.png"

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

    enrich_execs = _mock_enrich_exec(
        mock_db,
        likes_map={p1.id: 3},
        comments_map={p1.id: 1},
        user_liked_ids=[p1.id],
    )
    mock_db.execute.side_effect = [posts_res] + enrich_execs

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/posts")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["caption"] == "Post 1"
    assert data[0]["like_count"] == 3
    assert data[0]["comment_count"] == 1
    assert data[0]["is_liked_by_me"] is True
    assert data[1]["caption"] == "Post 2"
    assert data[1]["like_count"] == 0

    app.dependency_overrides.clear()


def test_list_posts_with_user_filter(mock_user_1, mock_db):
    client = TestClient(app)

    p1 = _make_post(mock_user_1, caption="Filtered post")
    posts_res = MagicMock()
    posts_res.scalars.return_value.all.return_value = [p1]

    enrich_execs = _mock_enrich_exec(mock_db)
    mock_db.execute.side_effect = [posts_res] + enrich_execs

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
    enrich_execs = _mock_enrich_exec(mock_db)
    mock_db.execute.side_effect = [posts_res] + enrich_execs

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

    enrich_execs = _mock_enrich_exec(mock_db, likes_map={post.id: 10})
    mock_db.execute.side_effect = enrich_execs

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/posts/{post.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(post.id)
    assert data["caption"] == "Specific post"
    assert data["like_count"] == 10

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

    enrich_execs = _mock_enrich_exec(mock_db)
    mock_db.execute.side_effect = enrich_execs

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
    post2 = _make_post(mock_user_1, caption="My own post")

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [post1, post2]
    mock_db.scalars.return_value = mock_scalars

    enrich_execs = _mock_enrich_exec(
        mock_db, likes_map={post1.id: 2}, comments_map={post1.id: 1}
    )
    mock_db.execute.side_effect = enrich_execs

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/feed")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) == 2
    assert data["next_cursor"] is None
    assert data["items"][0]["author"]["username"] == mock_user_2.username
    assert data["items"][0]["like_count"] == 2
    assert data["items"][0]["comment_count"] == 1

    app.dependency_overrides.clear()


def test_get_feed_pagination(mock_user_1, mock_user_2, mock_db):
    client = TestClient(app)

    post1 = _make_post(mock_user_2, caption="First post")
    post2 = _make_post(mock_user_1, caption="Second post")

    # limit=1, returning 2 items triggers next_cursor
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [post1, post2]
    mock_db.scalars.return_value = mock_scalars

    enrich_execs = _mock_enrich_exec(mock_db)
    mock_db.execute.side_effect = enrich_execs

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get("/feed?limit=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["next_cursor"] is not None

    app.dependency_overrides.clear()


def test_get_feed_with_cursor(mock_user_1, mock_db):
    client = TestClient(app)

    post = _make_post(mock_user_1, caption="Feed post")
    cursor = encode_cursor(post.created_at, post.id)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [post]
    mock_db.scalars.return_value = mock_scalars

    enrich_execs = _mock_enrich_exec(mock_db)
    mock_db.execute.side_effect = enrich_execs

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/feed?cursor={cursor}")
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

    enrich_execs = _mock_enrich_exec(mock_db)
    mock_db.execute.side_effect = enrich_execs

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

    enrich_execs = _mock_enrich_exec(mock_db)
    mock_db.execute.side_effect = enrich_execs

    app.dependency_overrides[get_curr_user] = lambda: mock_user_1
    app.dependency_overrides[get_db] = lambda: mock_db

    res = client.get(f"/users/{mock_user_2.id}/posts?limit=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["next_cursor"] is not None

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

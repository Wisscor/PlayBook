from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "20261016_notif_target_type"
down_revision: Union[str, Sequence[str], None] = "7e4bd034ce87"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("notifications")}

    foreign_keys = inspector.get_foreign_keys("notifications")
    target_foreign_keys = [
        foreign_key["name"]
        for foreign_key in foreign_keys
        if foreign_key.get("name")
        and foreign_key.get("constrained_columns") == ["target_id"]
    ]

    with op.batch_alter_table("notifications") as batch_op:
        for constraint_name in target_foreign_keys:
            batch_op.drop_constraint(constraint_name, type_="foreignkey")
        if "target_type" not in columns:
            batch_op.add_column(sa.Column("target_type", sa.String(length=32)))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("notifications")}

    if "target_type" not in columns:
        return

    with op.batch_alter_table("notifications") as batch_op:
        batch_op.drop_column("target_type")
        batch_op.create_foreign_key(
            "fk_notifications_target_id_posts",
            "posts",
            ["target_id"],
            ["id"],
            ondelete="CASCADE",
        )

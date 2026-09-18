"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("full_name", sa.String(255), nullable=False, server_default=""),
        sa.Column("phone", sa.String(32)),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="customer", index=True),
        sa.Column("currency", sa.String(16)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "addresses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("label", sa.String(64), nullable=False, server_default="home"),
        sa.Column("full_name", sa.String(255), nullable=False, server_default=""),
        sa.Column("phone", sa.String(32), nullable=False, server_default=""),
        sa.Column("city", sa.String(128), nullable=False, server_default=""),
        sa.Column("street", sa.String(512), nullable=False, server_default=""),
        sa.Column("notes", sa.String(512), nullable=False, server_default=""),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("name_ar", sa.String(255), nullable=False, server_default=""),
        sa.Column("name_en", sa.String(255), nullable=False, server_default=""),
        sa.Column("desc_ar", sa.Text()),
        sa.Column("desc_en", sa.Text()),
        sa.Column("image_url", sa.String(1024)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="SET NULL"), index=True),
        sa.Column("slug", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("name_ar", sa.String(255), nullable=False, server_default=""),
        sa.Column("name_en", sa.String(255), nullable=False, server_default=""),
        sa.Column("desc_ar", sa.Text()),
        sa.Column("desc_en", sa.Text()),
        sa.Column("brand", sa.String(128)),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("cost", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("stock", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("images", sa.JSON(), nullable=False),
        sa.Column("variants", sa.JSON()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "governorates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name_ar", sa.String(128), nullable=False, server_default=""),
        sa.Column("name_en", sa.String(128), nullable=False, server_default=""),
        sa.Column("fee", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_no", sa.String(32), nullable=False, unique=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("status", sa.String(24), nullable=False, server_default="pending", index=True),
        sa.Column("payment_method", sa.String(16), nullable=False, server_default="cod"),
        sa.Column("payment_status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column("currency", sa.String(16), nullable=False, server_default="EGP"),
        sa.Column("rate", sa.Numeric(12, 6), nullable=False, server_default="1"),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("delivery_fee", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("discount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("total", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("base_subtotal", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("base_delivery", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("base_discount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("base_total", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("promo_code", sa.String(64)),
        sa.Column("customer_name", sa.String(255), nullable=False, server_default=""),
        sa.Column("customer_phone", sa.String(32), nullable=False, server_default=""),
        sa.Column("address", sa.JSON()),
        sa.Column("governorate", sa.String(128)),
        sa.Column("notes", sa.Text()),
        sa.Column("courier_name", sa.String(128)),
        sa.Column("courier_phone", sa.String(32)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("delivered_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="SET NULL"), index=True),
        sa.Column("name_ar", sa.String(255), nullable=False, server_default=""),
        sa.Column("name_en", sa.String(255), nullable=False, server_default=""),
        sa.Column("image", sa.String(1024)),
        sa.Column("variant", sa.String(128)),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("qty", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=False),
    )
    op.create_table(
        "promos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(64), nullable=False, unique=True, index=True),
        sa.Column("type", sa.String(12), nullable=False),
        sa.Column("value", sa.Numeric(12, 2), nullable=False),
        sa.Column("min_order", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("product_id", "user_id"),
    )
    op.create_table(
        "site_settings",
        sa.Column("id", sa.Integer(), primary_key=True, server_default="1"),
        sa.Column("store_name", sa.String(255), nullable=False, server_default="NexShop"),
        sa.Column("tagline_ar", sa.String(512), nullable=False, server_default=""),
        sa.Column("tagline_en", sa.String(512), nullable=False, server_default=""),
        sa.Column("logo_url", sa.String(1024)),
        sa.Column("primary_color", sa.String(16), nullable=False, server_default="#6C4DF6"),
        sa.Column("theme_preset", sa.String(24), nullable=False, server_default="aurora"),
        sa.Column("dark_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("announcement_ar", sa.String(512), nullable=False, server_default=""),
        sa.Column("announcement_en", sa.String(512), nullable=False, server_default=""),
        sa.Column("base_currency", sa.String(16), nullable=False, server_default="EGP"),
        sa.Column("currencies", sa.JSON(), nullable=False),
        sa.Column("delivery_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("free_delivery_above", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("cod_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("stripe_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("stripe_secret_key", sa.String(512)),
        sa.Column("demo_payments", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("contact_phone", sa.String(32)),
        sa.Column("contact_email", sa.String(255)),
        sa.Column("contact_address", sa.String(512)),
        sa.Column("social", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    for table in (
        "site_settings", "reviews", "promos", "order_items", "orders",
        "governorates", "products", "categories", "addresses", "users",
    ):
        op.drop_table(table)

"""Payments service: COD, Stripe (hosted Checkout), Egyptian wallets and Demo mode.

Demo mode marks card orders as paid instantly so the whole flow can be
demonstrated without Stripe keys. SAFETY: demo mode is forcibly disabled
when ENV=production, so a live store can never confirm an order without
real payment.
"""

from __future__ import annotations

from dataclasses import dataclass

import stripe
from fastapi import HTTPException

from ..core.config import get_settings as get_cfg

WALLET_METHODS = ("vodafone_cash", "instapay", "fawry")


@dataclass
class PaymentResult:
    provider: str  # cod | stripe | demo | vodafone_cash | instapay | fawry
    url: str | None = None
    needs_redirect: bool = False
    demo: bool = False


class PaymentsService:
    def __init__(self, settings):
        self.s = settings

    @property
    def stripe_key(self) -> str | None:
        return (self.s.stripe_secret_key or "").strip() or None

    def is_demo(self) -> bool:
        # Hard safety guard: demo payments can NEVER happen in production
        if get_cfg().is_production:
            return False
        return bool(self.s.demo_payments) or not self.stripe_key or not self.s.stripe_enabled

    # ------------------------------------------------------------------ #
    def start_payment(self, order) -> PaymentResult:
        if order.payment_method == "cod":
            return PaymentResult(provider="cod")

        if order.payment_method in WALLET_METHODS:
            # Manual-confirm methods: customer transfers, merchant marks paid
            return PaymentResult(provider=order.payment_method)

        if self.is_demo():
            order.payment_status = "paid"
            return PaymentResult(provider="demo", needs_redirect=False, demo=True)

        stripe.api_key = self.stripe_key
        line_items = [
            {
                "quantity": max(1, it.qty),
                "price_data": {
                    "currency": order.currency.lower(),
                    "unit_amount": int(round(float(it.price * order.rate) * 100)),
                    "product_data": {"name": it.name_en or it.name_ar or "Item"},
                },
            }
            for it in order.items
        ]
        if float(order.delivery_fee) > 0:
            line_items.append(
                {
                    "quantity": 1,
                    "price_data": {
                        "currency": order.currency.lower(),
                        "unit_amount": int(round(float(order.delivery_fee) * 100)),
                        "product_data": {"name": "Delivery fee"},
                    },
                }
            )
        try:
            session = stripe.checkout.Session.create(
                mode="payment",
                line_items=line_items,
                client_reference=order.order_no,
                metadata={"order_id": str(order.id), "order_no": order.order_no},
                success_url=_front(self.s) + f"/order-success?order={order.order_no}&paid=1",
                cancel_url=_front(self.s) + f"/order-success?order={order.order_no}&cancelled=1",
            )
        except Exception as exc:  # stripe errors
            raise HTTPException(status_code=502, detail=f"Stripe error: {exc}") from exc
        return PaymentResult(provider="stripe", url=session.url, needs_redirect=True)

    # ------------------------------------------------------------------ #
    def handle_webhook(self, payload: bytes, sig_header: str | None) -> str | None:
        """Process a Stripe webhook. Returns the order_no if a payment completed."""
        if self.stripe_key:
            stripe.api_key = self.stripe_key
        secret = self.s.stripe_webhook_secret or ""
        try:
            if secret and sig_header:
                event = stripe.Webhook.construct_event(payload, sig_header, secret)
                if not isinstance(event, dict):
                    try:
                        event = dict(event)
                    except TypeError:
                        return None
            else:
                import json as _json

                event = _json.loads(payload.decode())
        except Exception:
            return None

        if not isinstance(event, dict):
            return None
        event_type = event.get("type", "")
        if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
            obj = event.get("data", {}).get("object", {})
            order_no = obj.get("client_reference") or (obj.get("metadata") or {}).get("order_no")
            return order_no or None
        return None


def _front(s) -> str:
    return (s.frontend_url or "").rstrip("/")

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core.deps import get_db
from ...models import Order
from ...services import PaymentsService, get_settings_row

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/stripe-webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    settings = get_settings_row(db)
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    order_no = PaymentsService(settings).handle_webhook(payload, sig)
    if order_no:
        o = db.execute(select(Order).where(Order.order_no == order_no)).scalar_one_or_none()
        if o and o.payment_status != "paid":
            o.payment_status = "paid"
            db.commit()
    return {"received": True}

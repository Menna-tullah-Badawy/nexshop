"""Email service — SMTP delivery with a console fallback for development.

When EMAIL_ENABLED is false (the default), emails are printed to the console
so the whole flow stays demonstrable without any credentials. Configure SMTP
via environment variables (SMTP_HOST, SMTP_USER, ...) for production.
"""

from __future__ import annotations

import smtplib
import ssl
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, parseaddr

from ..core.config import get_settings

cfg = get_settings()


def send_email(to: str, subject: str, html: str) -> bool:
    """Send an email. Returns True if it was handed to SMTP, False if console-fallback."""
    if not to:
        return False
    if not cfg.email_enabled or not cfg.smtp_host:
        print(f"[email:console] to={to} | subject={subject}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    name, addr = parseaddr(cfg.smtp_from)
    msg["From"] = formataddr((name, addr))
    msg["To"] = to
    msg.attach(MIMEText(html, "html", "utf-8"))

    def _deliver() -> None:
        try:
            if cfg.smtp_port == 465:
                server = smtplib.SMTP_SSL(cfg.smtp_host, 465, context=ssl.create_default_context(), timeout=15)
            else:
                server = smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=15)
                if cfg.smtp_starttls:
                    server.starttls(context=ssl.create_default_context())
            if cfg.smtp_user:
                server.login(cfg.smtp_user, cfg.smtp_password)
            server.sendmail(addr, [to], msg.as_string())
            server.quit()
        except Exception as exc:  # never break the request because of email
            print(f"[email:error] {exc}")

    threading.Thread(target=_deliver, daemon=True).start()
    return True


# --------------------------------------------------------------------------- #
# Templates (Arabic-first, simple inline styles that survive email clients)
# --------------------------------------------------------------------------- #

def _wrap(title: str, body_html: str, store_name: str) -> str:
    return f"""<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#f4f4f7;font-family:Tahoma,Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#111827;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:bold">{store_name}</div>
  <div style="padding:24px;color:#1f2937;font-size:14px;line-height:1.9">{body_html}</div>
  <div style="padding:16px 24px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px">{title} — {store_name}</div>
</div></body></html>"""


def send_order_confirmation(order, settings_row) -> None:
    """Customer-facing order confirmation."""
    items_html = "".join(
        f"<tr><td style='padding:6px 0'>{it.name_ar or it.name_en} × {it.qty}</td>"
        f"<td style='padding:6px 0;text-align:left'>{float(it.line_total):.2f}</td></tr>"
        for it in order.items
    )
    body = f"""
<h3 style="margin:0 0 12px">شكرًا لطلبك 🎉</h3>
<p>رقم الطلب: <b>{order.order_no}</b><br/>
الإجمالي: <b>{float(order.total):.2f} {order.currency}</b></p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb">{items_html}</table>
<p>هنبدأ نجهز طلبك فورًا، وهنوصلك تحديثات أول بأول.</p>
"""
    send_email(order.user.email if order.user else "", f"تأكيد الطلب {order.order_no}",
               _wrap("تأكيد طلب", body, settings_row.store_name))


def send_merchant_order_notice(order, settings_row) -> None:
    """Merchant notification about a new order."""
    to = settings_row.contact_email or ""
    body = f"""
<p dir="ltr">New order <b>{order.order_no}</b></p>
<p>العميل: {order.customer_name} — {order.customer_phone}<br/>
الإجمالي: <b>{float(order.base_total):.2f} {settings_row.base_currency}</b><br/>
الدفع: {order.payment_method}</p>
"""
    send_email(to, f"طلب جديد {order.order_no}", _wrap("طلب جديد", body, settings_row.store_name))


def send_password_reset(to_email: str, token: str, settings_row) -> None:
    from ..core.config import get_settings as _cfg

    base = (_cfg().frontend_url or "http://localhost:8081").rstrip("/")
    link = f"{base}/reset-password?token={token}"
    body = f"""
<p>وصلنا طلب لإعادة تعيين كلمة السر الخاصة بيك.</p>
<p><a href="{link}" style="display:inline-block;background:#111827;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">إعادة تعيين كلمة السر</a></p>
<p>أو انسخ الرابط ده: <span dir="ltr">{link}</span></p>
<p style="color:#9ca3af;font-size:12px">الرابط صالح لمدة {_cfg().password_reset_minutes} دقيقة. لو مش أنت اللي طلبت، تجاهل الإيميل ده.</p>
"""
    send_email(to_email, "إعادة تعيين كلمة السر", _wrap("استعادة الحساب", body, settings_row.store_name))


def send_status_update(order, settings_row) -> None:
    """Notify the customer when the order status changes."""
    labels = {
        "confirmed": ("تم تأكيد طلبك ✅", "طلبك اتأكد وبيتحضر للشحن."),
        "packing": ("طلبك بيتجهز 📦", "بنجهز طلبك دلوقتي وهيتسلم لشركة الشحن قريب."),
        "out_for_delivery": ("طلبك في الطريق 🚚", "المندوب تحرك بيك — استعد للاستلام."),
        "delivered": ("تم تسليم طلبك 🎉", "اتأكدت إن طلبك وصل. شكرًا لتسوقك معانا!"),
        "cancelled": ("تم إلغاء الطلب", "طلبك اتلغى. لو عندك سؤال رد على الإيميل ده."),
    }
    if order.status not in labels:
        return
    title, msg = labels[order.status]
    body = f"<p>رقم الطلب: <b>{order.order_no}</b></p><p>{msg}</p>"
    send_email(order.user.email if order.user else "", f"{title} — {order.order_no}",
               _wrap(title, body, settings_row.store_name))

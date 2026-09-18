/** Printable documents (shipping label + invoice) — opens the browser print dialog. */

import { Platform } from 'react-native'
import type { Order } from './types'

function esc(s: string | null | undefined): string {
  return (s ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function openHtml(html: string): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  setTimeout(() => {
    try {
      w.focus()
      w.print()
    } catch {
      /* noop */
    }
  }, 350)
  return true
}

/** بوليصة شحن — shipping label for the courier */
export function openShippingLabel(o: Order, storeName: string): boolean {
  const a = o.address
  const cod = o.payment_method === 'cod' ? `${o.total} ${o.currency}` : '—'
  const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>Label ${esc(o.order_no)}</title>
<style>
 body{font-family:Tahoma,Arial,sans-serif;margin:24px;color:#111}
 .box{border:2px solid #111;border-radius:10px;max-width:480px;padding:18px}
 .row{display:flex;justify-content:space-between;border-bottom:1px dashed #999;padding:8px 0}
 h1{font-size:18px;margin:0} .big{font-size:22px;font-weight:800}
 .muted{color:#555;font-size:12px}
 .items{font-size:13px;margin-top:8px}
</style></head><body>
<div class="box">
  <div class="row"><h1>${esc(storeName)}</h1><div class="big">${esc(o.order_no)}</div></div>
  <div class="row"><span class="muted">العميل</span><b>${esc(o.customer_name)}</b></div>
  <div class="row"><span class="muted">الموبايل</span><b dir="ltr">${esc(o.customer_phone)}</b></div>
  <div class="row"><span class="muted">العنوان</span>
    <span>${esc(o.governorate ?? '')} — ${esc(a?.city ?? '')} — ${esc(a?.street ?? '')}</span></div>
  <div class="row"><span class="muted">تحصيل عند الاستلام (COD)</span><b>${cod}</b></div>
  <div class="items">${o.items.map((it) => `<div>• ${esc(it.name_ar || it.name_en)} × ${it.qty}</div>`).join('')}</div>
  ${o.notes ? `<div class="muted" style="margin-top:8px">ملاحظات: ${esc(o.notes)}</div>` : ''}
</div>
</body></html>`
  return openHtml(html)
}

/** فاتورة العميل — customer-facing invoice */
export function openInvoice(o: Order, storeName: string, contact: { phone?: string | null; email?: string | null }): boolean {
  const rows = o.items
    .map(
      (it) => `<tr>
      <td style="padding:6px;border-bottom:1px solid #eee">${esc(it.name_ar || it.name_en)}${it.variant ? ` (${esc(it.variant)})` : ''}</td>
      <td style="padding:6px;border-bottom:1px solid #eee;text-align:center">${it.qty}</td>
      <td style="padding:6px;border-bottom:1px solid #eee;text-align:left">${(it.price * o.rate).toFixed(2)}</td>
      <td style="padding:6px;border-bottom:1px solid #eee;text-align:left">${(it.line_total * o.rate).toFixed(2)}</td>
    </tr>`,
    )
    .join('')
  const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>Invoice ${esc(o.order_no)}</title>
<style>body{font-family:Tahoma,Arial,sans-serif;margin:32px;color:#111} table{width:100%;border-collapse:collapse;margin-top:16px}
 h1{font-size:20px} .muted{color:#666;font-size:12px} .tot{font-size:18px;font-weight:800}</style></head><body>
<h1>${esc(storeName)} — فاتورة</h1>
<div class="muted">رقم الطلب: ${esc(o.order_no)} · التاريخ: ${new Date(o.created_at).toLocaleDateString('ar-EG')}
 · العميل: ${esc(o.customer_name)}</div>
<table><thead><tr style="background:#f5f5f5"><th style="padding:8px">المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
<tbody>${rows}</tbody></table>
<div style="margin-top:16px;text-align:left">
  <div>الإجمالي الفرعي: ${o.subtotal.toFixed(2)} ${o.currency}</div>
  <div>التوصيل: ${o.delivery_fee.toFixed(2)} ${o.currency}</div>
  ${o.discount > 0 ? `<div>الخصم (${esc(o.promo_code ?? '')}): -${o.discount.toFixed(2)} ${o.currency}</div>` : ''}
  <div class="tot">الإجمالي: ${o.total.toFixed(2)} ${o.currency}</div>
</div>
<div class="muted" style="margin-top:24px">${esc(contact.phone ?? '')} ${contact.email ? '· ' + esc(contact.email) : ''}</div>
</body></html>`
  return openHtml(html)
}

/** رابط واتساب مع رسالة جاهزة عن حالة الطلب */
export function whatsappOrderLink(o: Order, statusLabel: string, storeName: string): string {
  const phone = (o.customer_phone || '').replace(/[^0-9]/g, '')
  const intl = phone.startsWith('0') ? `2${phone}` : phone
  const msg = encodeURIComponent(`أهلًا ${o.customer_name} 👋\nطلبك رقم ${o.order_no} من ${storeName} حالته: ${statusLabel}.\nالإجمالي: ${o.total} ${o.currency}`)
  return `https://wa.me/${intl}?text=${msg}`
}

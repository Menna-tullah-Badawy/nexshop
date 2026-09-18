# 🛍️ NexShop — قالب تجارة إلكترونية كامل (قابل للبيع)

موقع + تطبيق (موبايل **و** ويب من كود واحد) لتجارة إلكترونية **كامل وشامل**: متجر، سلة،Checkout، دفع (COD + Stripe)، نظام عملات متعددة، لوحة إدارة كاملة، إدارة توصيل، تقييمات، كوبونات — وكله **White-Label** يعني تقدر تبيعه لأي عميل وتغير هويته في 5 دقايق.

## ✨ المميزات

### واجهة العميل
- 🏠 هوم: بحث فوري، تصنيفات، منتجات مميزة، ترتيب بالسعر/الأحدث
- 📦 منتجات: صور متعددة، خيارات (مقاسات/ألوان)، تقييمات ومرجعات
- 🛒 سلة + Checkout: عناوين محفوظة، مناطق توصيل بالمصاريف، كوبونات خصم
- 💳 **الدفع**: عند الاستلام (COD) أو بطاقة عبر **Stripe** (Checkout مضاف — شغال على الويب والموبايل من كود واحد)
- 💱 **عملات متعددة**: كل عميل يختار العملة من البروفايل (ج.م / دولار / ريال / درهم...) — أسعار الصرف من لوحة الإدارة
- 🌍 **عربي + إنجليزي** مع تبديل فوري (RTL/LTR)
- 🎨 **5 ستايلات تصميم** (Aurora / Minimal / Lux / Vibrant / Marketplace) + فاتح/داكن + لون أساسي مخصص — العميل يختار من البروفايل
- 📱 طلباتي: متابعة الحالة (جديد ← مؤكد ← تجهيز ← خرج للتوصيل ← تم)

### لوحة الإدارة (داخل نفس التطبيق — مسار /admin)
- 📊 داش بورد: إيراد اليوم/الشهر، رسم آخر 14 يوم، طلبات حديثة، مخزون منخفض، الأكثر مبيعًا
- 📦 منتجات وتصنيفات: CRUD كامل + تفعيل/إيقاف + صور + خيارات
- 🧾 طلبات: فلترة/بحث، تطوير الحالة، تعيين مندوب، تأكيد الدفع، إلغاء (يرجع المخزون)
- 🚚 التوصيل: قائمة جاهز للتوصيل + تعديل مصاريف 27 محافظة
- 👥 عملاء: إحصائيات شراء، تفعيل/إيقاف
- 🎟️ كوبونات: نسبة % أو مبلغ ثابت + حد أدنى + صلاحية
- ⚙️ **الإعدادات (قلب الـ White-Label)**: اسم المتجر، شعار، ألوان، ستايل، عملات وأسعار صرف، تفعيل طرق الدفع، Stripe key، تواصل/SNS

## 🧱 التيك ستاك

| الطبقة | التقنية |
|---|---|
| الواجهة (موبايل + ويب) | React Native 0.86 · Expo 57 · React Native Web · TypeScript · expo-router · Zustand |
| الباك إند | Python 3.13 · FastAPI 0.118 · SQLAlchemy 2 · Alembic · Pydantic v2 |
| قاعدة البيانات | PostgreSQL (ودocker Postgres 16) — وSQLite للتجربة السريعة |
| الدفع | Stripe (hosted Checkout + webhook) + COD + **وضع تجريبي** بدون keys |
| التطوير | GitHub Codespaces (devcontainer) · GitHub Actions (CI + Pages) |
| النشر | Render (API) + Neon/Supabase (DB) + GitHub Pages (ويب) أو Docker Compose كامل |

## 🚀 التشغيل السريع

### 1) Docker (الأسهل — كل حاجة بضغطة)
```bash
docker compose up --build
# الموقع: http://localhost:8081
# الـ API:  http://localhost:8000/docs
```

### 2) يدويًا (تطوير)
```bash
# الباك إند
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m app.seed          # بيانات تجريبية
.venv/bin/uvicorn app.main:app --reload --port 8000

# التطبيق
cd app
npm install
npm run brand                          # حقن الهوية من config/brand.json
npx expo start                         # --web للويب، --android / --ios للموبايل
```

> بدون Postgres؟ حط `DATABASE_URL=sqlite:///./backend/dev.db` في `backend/.env` — الكود بيدعم الاتنين.

### 3) GitHub Codespaces
افتح الريبو → **Codespaces → Create codespace** — البيئة هتجهز نفسها (venv + npm + seed) وتشتغل على 8000/8081 مباشرة.

## 🔑 حسابات تجريبية (بعد الـ seed)

| الدور | الإيميل | كلمة المرور |
|---|---|---|
| أدمن | `admin@nexshop.dev` | `Admin123!` |
| عميل | `customer@nexshop.dev` | `Customer123!` |

كوبونات: `WELCOME10` (خصم 10% فوق 200) · `SAVE50` (خصم 50 فوق 500)

## 💳 ضبط Stripe

1. **وضع تجريبي (الافتراضي)**: مفيش keys = الطلبات بتتأكد فورًا — ممتاز للديمو والبيع.
2. **تست مود حقيقي**:
   - خذ `sk_test_...` من Stripe Dashboard
   - من **الإدارة → الإعدادات → الدفع**: فعّل Stripe، حط الـ key، ولّي "الوضع التجريبي"
   - الـ Webhook: `https://api.yourdomain.com/api/payments/stripe-webhook`
   - محليًا: `stripe listen --forward-to localhost:8000/api/payments/stripe-webhook`
3. **Production**: حط `STRIPE_WEBHOOK_SECRET` في متغيرات البيئة وغيّر للـ key الحقيقي.

> ملاحظة: استخدمنا **Stripe Checkout (صفحة دفع مضافة)** — شغالة بدون موديولات native (تشتغل في Expo Go)، لو حبيت "Payment Element" داخل الواجهة، الاستبداله موضح في `backend/app/services/payments.py`.

## 💱 العملات

- كل الأسعار مخزنة بـ**العملة الأساسية** (افتراضيًا **جنيه مصري**)
- في **الإدارة → الإعدادات** تحط أسعار الصرف: `1 جنيه = 0.02 USD` إلخ
- العميل يختار عمله من **البروفايل** والأسعار كلها بتتحول لحته
- الطلب بيخزن الإجماليين: بالعملة المعروضة **و** بالعملة الأساسية (لحاسباتك) + سعر الصرف وقت الطلب

## 🎨 White-Label — إزاي تبيع النسخة تاني؟

### المسار السريع (10 دقايق لكل عميل)
1. شغّل النسخة للعميل (compose أو Codespace)
2. ادخل بـ الأدمن → **الإعدادات**
3. غيّر: الاسم، الشعار (رابط صورة)، اللون الأساسي، ستايل التصميم، الإعلان، تواصل/SNS، العملات
4. حفظ ✅ — العميل شايف المتجر بهويته كاملة

### طبقات التخصيص (من الأقوى للأضعف)
| الطبقة | الوصف |
|---|---|
| **الإدارة (runtime)** | كل حاجة في `site_settings` — بتتغير لحظي من اللوحة، من غير إعادة بناء |
| **`config/brand.json` + `npm run brand`** | قيم البناء: اسم، ألوان، شعار، عملات — بتتحقن في `app/.env` (EXPO_PUBLIC_*) قبل الـ build |
| **متغيرات البيئة** | `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `STRIPE_*`, `CORS_ORIGINS`, `EXPO_PUBLIC_API_URL` |
| **الكود** | الستايلات كلها من نظام الثيم (`src/theme/presets.ts`) — أضف ستايل جديد = أضيف entry جديد |

### نشر نسخة للعميل
```bash
# 1) غيّر الهوية
#    الإدارة → الإعدادات (أو config/brand.json + npm run brand)
# 2) انشر الـ API على Render
#    Runtime: Python · Build: pip install -r backend/requirements.txt
#    Start: uvicorn app.main:app --host 0.0.0.0 --port $PORT
#    Env: DATABASE_URL (من Neon) + JWT_SECRET + FRONTEND_URL + CORS_ORIGINS
# 3) انشر الويب
#    GitHub Pages (workflow جاهز) أو Render Static (dist/ من npm run build:web)
#    EXPO_PUBLIC_API_URL=https://api.yourclient.com/api
```

## 🗄️ مخطط البيانات

```
users ─┬─ addresses
       ├─ orders ── order_items ── products ── categories
       │                │
       └─ reviews ──────┘
site_settings (صف واحد: هوية + عملات + دفع + تواصل)
governorates (مناطق التوصيل + المصاريف)
promos (كوبونات)
```

**مسير الطلب**: `pending → confirmed → packing → out_for_delivery → delivered` (+ `cancelled`)
**الدفع**: `pending → paid` (COD بيتأكد تلقائيًا عند التوصيل / Stripe بالـ webhook)

## 🧪 التستات
```bash
cd backend && .venv/bin/pytest -q     # 26 testcase: auth · catalog · checkout ·
                                      # currencies · promos · lifecycle · admin · white-label
```

## 📁 هيكل المشروع
```
├── app/                     # Expo (موبايل + ويب) — TypeScript
│   ├── app/                 # routes (expo-router)
│   │   ├── (auth)/          # login · register
│   │   ├── (shop)/          # home · categories · product · cart · checkout
│   │   │                    # orders · order-success · profile
│   │   └── (admin)/         # dashboard · products · categories · orders
│   │                        # delivery · customers · promos · settings
│   └── src/                 # lib (api) · stores · theme · i18n · components
├── backend/
│   ├── app/
│   │   ├── api/v1/          # auth · meta · catalog · orders · payments · admin
│   │   ├── models/ · schemas/ · services/ (currency, payments, orders)
│   │   └── seed.py
│   ├── alembic/             # migrations
│   └── tests/
├── .devcontainer/           # Codespaces
├── .github/workflows/       # ci.yml + deploy-web.yml
├── config/brand.json        # ⭐ white-label build config
└── docker-compose.yml
```

## 🔐 ملاحظات أمان قبل الإنتاج
- غيّر `JWT_SECRET` (طول ≥ 32)
- `CORS_ORIGINS` = دومينك مش `*`
- احفظ الـ Stripe key في بيئة/الإدارة بس (مش في الكود)
- المصادقة JWT access (ساعة) + refresh (30 يوم) — الـ refresh بيدور تلقائي

## 🧭 أفكار للتوسعة (ready-made للـ v2)
- إشعارات Push (expo-notifications) · بونص نقاط للعملاء · دعم WhatsApp/Chatwoot
- ربط مندوبين (Bosta/Aramex API) بدل الدليفري اليدوي · تقارير PDF
- شريط شحن مجاني (الحد موجود بالإعلان حاليًا) · فلاتر سعر متقدمة

---
**NexShop v1.0** — مبني عشان يتباع 💜

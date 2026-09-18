# رفع مشروع NexShop على الجيت هاب 🚀

## الخطوات من جهازك (5 دقايق)

### 1) اعملي ريبو فاضي على الجيت هاب
روحي على: **github.com → New repository**
- الاسم: `nexshop` (أو أي اسم)
- **متخليهوش** فيه README أو .gitignore (الريبو بتاعنا جاهز)
- ممكن يبقى **Private** (أنسب لمنتج هتبيعه)

### 2) فكّي الضغط وادفعي الكود
بعد ما تنزلي `nexshop-upload.zip` وتفكّيه، افتحي تيرمنال في مجلد `nexshop`:

```bash
cd nexshop
git init -b main
git add -A
git commit -m "NexShop v1.0"
git remote add origin https://github.com/YOUR_USERNAME/nexshop.git
git push -u origin main
```

> استبدلي `YOUR_USERNAME` باسمك على الجيت هاب. هيسألك على اليوزر والباسورد —
> الباسورد لازم يكون **Personal Access Token** (مش باسورد الجيت هاب):
> **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
> اختاري الريبو بس + صلاحية **Contents: Read and write**.

### 3) عدّلي عليه على طول هناك
- أي تعديل: **Codespaces** من صفحة الريبو (زر **Code → Codespaces**) — هيفتح بيئة كاملة جاهزة:
  بايثون + نود + كل الديبندنسيز متسطبة تلقائيًا (عندنا `devcontainer` معمول خصيصًا لكده)،
  وهيفتحلك بورت **8000** للـ API و **8081** للموقع.
- أو اشتغلي محليًا بنفس خطوات الـ README:
  ```bash
  cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt
  cd ../app && npm install && npm run brand && npm start
  ```

## اللي هيشتغل تلقائي بعد الرفع
| الحاجة | إمتى |
|---|---|
| **CI**: تيستات الباكند + TypeScript + بيلد الويب + دوكّر | مع كل `push` أو PR |
| **النشر على GitHub Pages** | يدوي من تبويب **Actions → Deploy web** (بعد تفعيل Pages من Settings) |

### قبل أول تشغيل للـ Pages (مرة واحدة بس)
1. **Settings → Pages → Source: GitHub Actions**
2. **Settings → Secrets and variables → Actions → Variables**:
   ضيفي `EXPO_PUBLIC_API_URL` = رابط الـ API بعد ما تنشريه (مثلاً على Render)

## بيانات الدخول الديمو (موجودة كمان في الـ README)
| الدور | إيميل | باسورد |
|---|---|---|
| أدمن | admin@nexshop.dev | Admin123! |
| عميل | customer@nexshop.dev | Customer123! |

كوبونات: `WELCOME10` (10%) · `SAVE50` (خصم 50)

## ملاحظة مهمة
ملفات البيئة الحقيقية (`backend/.env` و `app/.env`) **مش** في الريبو — كل واحدة
بتتولّد محليًا (`npm run brand` للواجهة، ونسخة من `.env.example` للباكند).
لو عايزة تدفعي على ريبو **موجود بالفعل** فيه ملفات، قولي وأظبطلك الأمر.

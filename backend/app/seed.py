"""Demo data seed — run with:  python -m app.seed

Creates: admin + demo customer, settings, 6 categories, 18 products,
27 governorates with delivery fees, 2 promo codes and sample reviews.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .core.security import hash_password
from .db.base import Base
from .db.session import SessionLocal, engine
from .models import (
    Address,
    Category,
    Governorate,
    Product,
    Review,
    SiteSettings,
    User,
)
from .schemas import slugify

ADMIN_EMAIL = "admin@nexshop.dev"
ADMIN_PASSWORD = "Admin123!"
DEMO_EMAIL = "customer@nexshop.dev"
DEMO_PASSWORD = "Customer123!"

CATEGORIES = [
    ("إلكترونيات", "Electronics", "هواتف، لابتوبات وإكسسوارات", "Phones, laptops & accessories", "https://picsum.photos/seed/nx-elec/600/600"),
    ("موضة رجالي", "Men Fashion", "ملابس رجالي وأحذية", "Men's clothing & shoes", "https://picsum.photos/seed/nx-men/600/600"),
    ("موضة نسائي", "Women Fashion", "ملابس نسائي وإكسسوارات", "Women's clothing & accessories", "https://picsum.photos/seed/nx-women/600/600"),
    ("الجمال والعناية", "Beauty & Care", "عناية بالبشرة والشعر", "Skin & hair care", "https://picsum.photos/seed/nx-beauty/600/600"),
    ("المنزل والمطبخ", "Home & Kitchen", "أدوات منزل ومطبخ", "Home & kitchen essentials", "https://picsum.photos/seed/nx-home/600/600"),
    ("رياضة ولياقة", "Sports & Fitness", "ملابس رياضية ومعدات", "Sportswear & equipment", "https://picsum.photos/seed/nx-sport/600/600"),
]

PRODUCTS = [
    # (cat_idx, name_ar, name_en, desc_ar, desc_en, brand, price, stock, featured, variants, seed)
    (0, "سماعات بلوتوث لاسلكية", "Wireless Bluetooth Headphones", "صوت نقي وعزل ضوضاء مع بطارية 30 ساعة", "Crystal sound & noise isolation, 30h battery", "SoundMax", 1850, 42, True, None, "nx-hp"),
    (0, "سماعات أذن رياضية", "Sport Earbuds", "مقاومة للماء مع شحن سريع", "Water resistant with fast charging", "SoundMax", 750, 80, False, None, "nx-eb"),
    (0, "ساعة ذكية الجيل 7", "Smartwatch Gen 7", "شاشة AMOLED، تتبع صحة كامل، مقاومة مياه", "AMOLED display, full health tracking, water resistant", "Pulse", 3200, 25, True, None, "nx-sw"),
    (0, "باور بانك 20000", "Power Bank 20000mAh", "شحن سريع 22.5 وات، شاشة رقمية", "22.5W fast charging with digital display", "Volt", 650, 120, False, None, "nx-pb"),
    (1, "تي شيرت قطن كلاسيك", "Classic Cotton T-Shirt", "قطن مصري 100% قصّة مريحة", "100% Egyptian cotton, comfy fit", "Urban", 350, 200, True, [{"label": "Size", "values": ["S", "M", "L", "XL"]}], "nx-tee"),
    (1, "hoodie شتوي مبطن", "Winter Fleece Hoodie", "بطانة فلانيل دافية", "Warm fleece lining", "Urban", 890, 75, False, [{"label": "Size", "values": ["S", "M", "L", "XL"]}], "nx-hood"),
    (1, "بنطلون جينز سليت", "Slim Fit Jeans", "دنيم مرن قصّة سليت", "Stretch denim, slim fit", "DenimCo", 1100, 60, False, [{"label": "Size", "values": ["30", "32", "34", "36"]}], "nx-jeans"),
    (1, "حذاء رياضي كلاود", "Cloud Runner Sneakers", "نعل إسفنجي خفيف", "Light foam sole", "Stride", 1650, 40, True, [{"label": "Size", "values": ["40", "41", "42", "43", "44"]}], "nx-snk"),
    (2, "فستان صيفي فلالينا", "Floral Summer Dress", "قماش فلالينا خفيف", "Light flannel fabric", "Bella", 950, 55, True, [{"label": "Size", "values": ["S", "M", "L"]}], "nx-dress"),
    (2, "جاكيت جينز نسائي", "Women's Denim Jacket", "قصّة عصرية مريحة", "Modern comfortable cut", "Bella", 1250, 35, False, None, "nx-jkt"),
    (2, "حقيبة يد جلدية", "Leather Handbag", "جلد طبيعي بحجم مناسب", "Genuine leather, everyday size", "Mira", 1980, 30, True, None, "nx-bag"),
    (2, "حذاء كعب أنيق", "Elegant Heels", "كعب متوسط مريح", "Comfortable medium heel", "Mira", 1450, 45, False, [{"label": "Size", "values": ["36", "37", "38", "39"]}], "nx-heel"),
    (3, "سيروم فيتامين سي", "Vitamin C Serum", "تفتيح وتوحيد لون البشرة", "Brightening & even tone", "Glow", 520, 150, True, None, "nx-vc"),
    (3, "كريم مرطب هاليو", "Hyaluronic Moisturizer", "ترطيب عميق 24 ساعة", "24h deep hydration", "Glow", 480, 130, False, None, "nx-hy"),
    (3, "واقي شمس SPF50", "Sunscreen SPF50", "حماية عالية بدون لمعة", "High protection, no shine", "Glow", 390, 200, False, None, "nx-spf"),
    (4, "طقم أواني سيراميك", "Ceramic Cookware Set", "10 قطع خفيفة وغير لاصقة", "10-piece light non-stick set", "Casa", 2450, 28, True, None, "nx-pot"),
    (4, "مكنسة كهربائية لاسلكية", "Cordless Vacuum", "شحنة تدوم 45 دقيقة بشفق قوي", "45min runtime, strong suction", "Casa", 3900, 18, False, None, "nx-vac"),
    (5, "حبل مقاومة رياضي", "Resistance Bands Set", "5 مستويات مقاومة", "5 resistance levels", "FitPro", 380, 90, False, None, "nx-bands"),
]

GOVERNORATES = [
    ("القاهرة", "Cairo", 25), ("الجيزة", "Giza", 25), ("الإسكندرية", "Alexandria", 35),
    ("القليوبية", "Qalyubia", 30), ("الدقهلية", "Dakahlia", 40), ("الشرقية", "Sharqia", 40),
    ("الغربية", "Gharbia", 35), ("المنوفية", "Menoufia", 35), ("البحيرة", "Beheira", 40),
    ("كفر الشيخ", "Kafr El Sheikh", 40), ("دمياط", "Damietta", 40), ("بورسعيد", "Port Said", 45),
    ("الإسماعيلية", "Ismailia", 45), ("السويس", "Suez", 45), ("الفيوم", "Faiyum", 45),
    ("بني سويف", "Bani Suef", 45), ("المنيا", "Minya", 50), ("أسيوط", "Asyut", 55),
    ("سوهاج", "Sohag", 55), ("قنا", "Qena", 60), ("الأقصر", "Luxor", 65),
    ("أسوان", "Aswan", 70), ("البحر الأحمر", "Red Sea", 75), ("مطروح", "Matrouh", 70),
    ("شمال سيناء", "North Sinai", 80), ("جنوب سيناء", "South Sinai", 80), ("الوادي الجديد", "New Valley", 80),
]


def seed_all(db: Session) -> None:
    # ---------------- settings ---------------- #
    if db.execute(select(SiteSettings).where(SiteSettings.id == 1)).scalar_one_or_none() is None:
        db.add(
            SiteSettings(
                id=1,
                store_name="NexShop",
                tagline_ar="كل اللي محتاجه، يوصلك.",
                tagline_en="Everything you need, delivered.",
                logo_url="/static/logo.png",
                primary_color="#6C4DF6",
                theme_preset="aurora",
                announcement_ar="🚚 توصيل مجاني للطلبات فوق 1000 جنيه",
                announcement_en="🚚 Free delivery on orders over 1000 EGP",
                base_currency="EGP",
                currencies=[
                    {"code": "USD", "rate": 0.02, "enabled": True},
                    {"code": "SAR", "rate": 0.075, "enabled": True},
                    {"code": "AED", "rate": 0.073, "enabled": True},
                ],
                delivery_enabled=True,
                cod_enabled=True,
                stripe_enabled=False,
                demo_payments=True,
                contact_phone="+20 100 000 0000",
                contact_email="support@nexshop.com",
                contact_address="Nasr City, Cairo, Egypt",
                social={"instagram": "nexshop", "facebook": "nexshop", "whatsapp": "+201000000000"},
            )
        )

    # ---------------- users ---------------- #
    if db.execute(select(User).where(User.email == ADMIN_EMAIL)).scalar_one_or_none() is None:
        db.add(User(email=ADMIN_EMAIL, full_name="Store Admin", role="admin",
                    hashed_password=hash_password(ADMIN_PASSWORD)))
    if db.execute(select(User).where(User.email == DEMO_EMAIL)).scalar_one_or_none() is None:
        demo = User(email=DEMO_EMAIL, full_name="أحمد محمد", phone="+201012345678",
                    role="customer", hashed_password=hash_password(DEMO_PASSWORD), currency="EGP")
        db.add(demo)
        db.flush()
        db.add(Address(user_id=demo.id, label="home", full_name="أحمد محمد", phone="+201012345678",
                       city="القاهرة", street="15 شارع التحرير، المعادي", is_default=True))

    # ---------------- categories ---------------- #
    cats: list[Category] = []
    for i, (ar, en, dar, den, img) in enumerate(CATEGORIES):
        c = db.execute(select(Category).where(Category.slug == slugify(en))).scalar_one_or_none()
        if c is None:
            c = Category(slug=slugify(en), name_ar=ar, name_en=en, desc_ar=dar, desc_en=den,
                         image_url=img, sort_order=i)
            db.add(c)
            db.flush()
        cats.append(c)

    # ---------------- products ---------------- #
    for (ci, ar, en, dar, den, brand, price, stock, featured, variants, seed) in PRODUCTS:
        slug = slugify(en)
        exists = db.execute(select(Product).where(Product.slug == slug)).scalar_one_or_none()
        if exists:
            continue
        images = [f"https://picsum.photos/seed/{seed}-a/700/700", f"https://picsum.photos/seed/{seed}-b/700/700"]
        db.add(Product(
            category_id=cats[ci].id, slug=slug, name_ar=ar, name_en=en, desc_ar=dar, desc_en=den,
            brand=brand, price=price, cost=round(price * 0.62, 2), stock=stock,
            images=images, variants=variants, is_active=True, is_featured=featured,
        ))

    # ---------------- governorates ---------------- #
    if db.execute(select(Governorate).limit(1)).scalar_one_or_none() is None:
        for ar, en, fee in GOVERNORATES:
            db.add(Governorate(name_ar=ar, name_en=en, fee=fee))

    # ---------------- promos ---------------- #
    from .models import Promo

    for code, ptype, value, min_order in [("WELCOME10", "percent", 10, 200), ("SAVE50", "fixed", 50, 500)]:
        if db.execute(select(Promo).where(Promo.code == code)).scalar_one_or_none() is None:
            db.add(Promo(code=code, type=ptype, value=value, min_order=min_order,
                         active=True, expires_at=datetime.now(timezone.utc) + timedelta(days=365)))

    # ---------------- reviews ---------------- #
    if db.execute(select(Review).limit(1)).scalar_one_or_none() is None:
        demo_user = db.execute(select(User).where(User.email == DEMO_EMAIL)).scalar_one()
        headphones = db.execute(select(Product).where(Product.slug == slugify("Wireless Bluetooth Headphones"))).scalar_one_or_none()
        if headphones and demo_user:
            db.add(Review(product_id=headphones.id, user_id=demo_user.id, rating=5,
                          text="صوت ممتاز وبطارية تدوم فعلًا!"))
    db.commit()


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_all(db)
        print("✅ Seeded.")
        print(f"   Admin:    {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"   Customer: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print("   Promos:   WELCOME10 (10% off min 200)  ·  SAVE50 (50 off min 500)")
    finally:
        db.close()


if __name__ == "__main__":
    main()

"""Multi-currency helpers.

Convention:
- All prices are stored in the store's BASE currency (e.g. EGP).
- `currencies` on SiteSettings is a list of {code, rate, enabled} where
  `rate` = how many units of `code` equal 1 unit of the base currency.
  e.g. base EGP, USD rate 0.02  ->  100 EGP displays as 2 USD.
"""

from decimal import Decimal, ROUND_HALF_UP

Q2 = Decimal("0.01")


def q2(value) -> Decimal:
    return Decimal(str(value)).quantize(Q2, rounding=ROUND_HALF_UP)


CURRENCY_INFO = {
    "EGP": {"name_ar": "جنيه مصري", "name_en": "Egyptian Pound", "symbol": "E£"},
    "USD": {"name_ar": "دولار أمريكي", "name_en": "US Dollar", "symbol": "$"},
    "SAR": {"name_ar": "ريال سعودي", "name_en": "Saudi Riyal", "symbol": "SR"},
    "AED": {"name_ar": "درهم إماراتي", "name_en": "UAE Dirham", "symbol": "AED"},
    "KWD": {"name_ar": "دينار كويتي", "name_en": "Kuwaiti Dinar", "symbol": "KD"},
    "QAR": {"name_ar": "ريال قطري", "name_en": "Qatari Riyal", "symbol": "QR"},
    "BHD": {"name_ar": "دينار بحريني", "name_en": "Bahraini Dinar", "symbol": "BD"},
    "OMR": {"name_ar": "ريال عُماني", "name_en": "Omani Rial", "symbol": "OMR"},
    "GBP": {"name_ar": "جنيه إسترليني", "name_en": "British Pound", "symbol": "£"},
    "EUR": {"name_ar": "يورو", "name_en": "Euro", "symbol": "€"},
}


def rates_map(settings) -> dict[str, Decimal]:
    out: dict[str, Decimal] = {settings.base_currency: Decimal("1")}
    for c in settings.currencies or []:
        if c.get("enabled", True) and c.get("code"):
            out[c["code"]] = Decimal(str(c.get("rate", "0")))
    return out


def convert(amount, from_code: str, to_code: str, settings) -> Decimal:
    """Convert an amount between supported currencies via the base."""
    if from_code == to_code:
        return q2(amount)
    rates = rates_map(settings)
    f = rates.get(from_code)
    t = rates.get(to_code)
    if not f or not t:
        return q2(amount)
    base = settings.base_currency
    base_amount = Decimal(str(amount)) / f if from_code != base else Decimal(str(amount))
    result = base_amount * t if to_code != base else base_amount / t
    return q2(result)


def currency_list(settings) -> list[dict]:
    """Full currency list incl. base, with localized names (for the client)."""
    out = []
    for c in settings.currencies or []:
        if not c.get("enabled", True):
            continue
        code = c.get("code", "")
        if not code:
            continue
        info = CURRENCY_INFO.get(code, {"name_ar": code, "name_en": code, "symbol": code})
        out.append(
            {
                "code": code,
                "rate": float(Decimal(str(c.get("rate", "1")))),
                **info,
            }
        )
    info = CURRENCY_INFO.get(settings.base_currency, {
        "name_ar": settings.base_currency, "name_en": settings.base_currency, "symbol": ""
    })
    base = {"code": settings.base_currency, "rate": 1.0, **info}
    if not any(x["code"] == settings.base_currency for x in out):
        out.insert(0, base)
    return out

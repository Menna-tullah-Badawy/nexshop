import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core.config import get_settings
from ...core.deps import get_current_user, get_db
from ...core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from ...models import Address, PasswordResetToken, User
from ...schemas import (
    AddressIn,
    AddressOut,
    ForgotPasswordIn,
    LoginIn,
    Msg,
    RefreshIn,
    ResetPasswordIn,
    TokenOut,
    UserCreate,
    UserOut,
    UserUpdate,
)
from ...services import get_settings_row, mailer, rate_limit
from jwt import PyJWTError

router = APIRouter(prefix="/auth", tags=["auth"])


def _tokens(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id), user.role),
        user=UserOut.model_validate(user),
    )


@router.post(
    "/register",
    response_model=TokenOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(20, 3600))],
)
def register(body: UserCreate, db: Session = Depends(get_db)):
    exists = db.execute(select(User).where(User.email == body.email.lower())).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email.lower(),
        full_name=body.full_name,
        phone=body.phone,
        hashed_password=hash_password(body.password),
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _tokens(user)


@router.post("/login", response_model=TokenOut, dependencies=[Depends(rate_limit(10, 60))])
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == body.email.lower())).scalar_one_or_none()
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    return _tokens(user)


@router.post("/forgot-password", response_model=Msg, dependencies=[Depends(rate_limit(3, 600))])
def forgot_password(body: ForgotPasswordIn, db: Session = Depends(get_db)):
    """Always answers 200 (avoids leaking which emails are registered)."""
    generic = Msg(detail="If this email is registered, a reset link has been sent")
    user = db.execute(select(User).where(User.email == body.email.lower())).scalar_one_or_none()
    if user is None or not user.is_active:
        return generic
    token = secrets.token_urlsafe(32)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=get_settings().password_reset_minutes),
        )
    )
    db.commit()
    mailer.send_password_reset(user.email, token, get_settings_row(db))
    return generic


@router.post("/reset-password", response_model=Msg, dependencies=[Depends(rate_limit(10, 600))])
def reset_password(body: ResetPasswordIn, db: Session = Depends(get_db)):
    row = db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == body.token)
    ).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    expires = row.expires_at if row and row.expires_at.tzinfo else None
    if expires is None:
        expires = row.expires_at.replace(tzinfo=timezone.utc) if row else now
    if row is None or row.used or expires < now:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user = db.get(User, row.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user.hashed_password = hash_password(body.password)
    row.used = True
    db.commit()
    return Msg(detail="Password updated — you can sign in now")


@router.post("/refresh", response_model=TokenOut)
def refresh(body: RefreshIn, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token)
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.get(User, int(payload.get("sub", 0)))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return _tokens(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(body: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = body.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        user.hashed_password = hash_password(data.pop("password"))
    for field, value in data.items():
        if field == "currency" and value in ("", "base"):
            value = None
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/addresses", response_model=list[AddressOut])
def list_addresses(user: User = Depends(get_current_user)):
    return user.addresses


@router.post("/addresses", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(body: AddressIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.is_default:
        for a in user.addresses:
            a.is_default = False
    addr = Address(user_id=user.id, **body.model_dump())
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr


@router.delete("/addresses/{address_id}", response_model=Msg)
def delete_address(address_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    addr = next((a for a in user.addresses if a.id == address_id), None)
    if addr is None:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(addr)
    db.commit()
    return Msg(detail="Address deleted")

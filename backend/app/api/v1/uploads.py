"""Image uploads for the admin (product photos, logos).

Files are stored on disk under UPLOAD_DIR and served at /uploads/<name>.
For production scale-out, swap the storage for S3-compatible object storage —
only this file needs to change.
"""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ...core.config import get_settings
from ...core.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])

ALLOWED = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
_CHUNK = 1024 * 1024


@router.post("/upload", status_code=201)
async def upload_image(file: UploadFile = File(...)):
    cfg = get_settings()
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext or 'unknown'}")

    max_bytes = cfg.max_upload_mb * 1024 * 1024
    data = bytearray()
    while chunk := await file.read(_CHUNK):
        data.extend(chunk)
        if len(data) > max_bytes:
            raise HTTPException(status_code=413, detail=f"File too large (max {cfg.max_upload_mb} MB)")
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    directory = Path(cfg.upload_dir)
    directory.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    (directory / name).write_bytes(bytes(data))
    return {"url": f"/uploads/{name}", "filename": file.filename, "size": len(data)}

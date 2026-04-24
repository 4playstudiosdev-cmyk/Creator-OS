# backend/app/api/tiktok.py
# TikTok Integration for Nexora OS
# Sandbox mode — test with authorized accounts

import os
import httpx
import secrets
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
from supabase import create_client

router = APIRouter(prefix="/api/tiktok", tags=["TikTok"])

# ── Config ────────────────────────────────────────────────────────────────────
APP_ENV       = os.environ.get("APP_ENV", "production")
IS_LOCAL      = APP_ENV == "local"

CLIENT_KEY    = os.environ.get("TIKTOK_CLIENT_KEY", "sbaw4z3judy9pe5tbe")
CLIENT_SECRET = os.environ.get("TIKTOK_CLIENT_SECRET", "")  # Add real secret

LOCAL_REDIRECT = "http://localhost:8000/api/tiktok/callback"
PROD_REDIRECT  = "https://creator-os-production-0bf8.up.railway.app/api/tiktok/callback"
REDIRECT_URI   = LOCAL_REDIRECT if IS_LOCAL else PROD_REDIRECT

LOCAL_FRONTEND = "http://localhost:5173"
PROD_FRONTEND  = "https://creator-os-ochre.vercel.app"
FRONTEND_URL   = LOCAL_FRONTEND if IS_LOCAL else PROD_FRONTEND

TT_AUTH  = "https://www.tiktok.com/v2/auth/authorize/"
TT_TOKEN = "https://open.tiktokapis.com/v2/oauth/token/"
TT_API   = "https://open.tiktokapis.com/v2"

# State store
_STATES: dict = {}

# ── Supabase ──────────────────────────────────────────────────────────────────
def get_sb():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )

def get_token(user_id: str, sb) -> tuple[str, str]:
    try:
        r = sb.table("tiktok_connections") \
            .select("access_token, open_id") \
            .eq("user_id", user_id) \
            .maybe_single().execute()
        if r and r.data and r.data.get("access_token"):
            return r.data["access_token"], r.data["open_id"]
    except Exception:
        pass
    raise HTTPException(401, "TikTok not connected. Go to Settings → Connect TikTok.")


# ─────────────────────────────────────────────────────────────────────────────
# 1. OAUTH START
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/auth")
async def tiktok_auth(user_id: str):
    from urllib.parse import urlencode
    import hashlib, base64

    state         = secrets.token_urlsafe(16)
    _STATES[state] = user_id

    # PKCE
    code_verifier  = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    digest         = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    _STATES[f"cv_{state}"] = code_verifier

    params = {
        "client_key":             CLIENT_KEY,
        "response_type":          "code",
        "scope":                  "user.info.basic,video.upload,video.publish,user.info.profile,user.info.stats,video.list",
        "redirect_uri":           REDIRECT_URI,
        "state":                  state,
        "code_challenge":         code_challenge,
        "code_challenge_method":  "S256",
    }
    auth_url = TT_AUTH + "?" + urlencode(params)
    print(f"[TikTok Auth] Starting OAuth for user={user_id[:8]}...")
    return RedirectResponse(auth_url)


# ─────────────────────────────────────────────────────────────────────────────
# 2. OAUTH CALLBACK
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/callback")
async def tiktok_callback(request: Request, sb=Depends(get_sb)):
    params  = dict(request.query_params)
    code    = params.get("code")
    state   = params.get("state")
    error   = params.get("error")

    if error:
        return RedirectResponse(f"{FRONTEND_URL}/settings?tiktok_error={error}")

    user_id       = _STATES.pop(state, None)
    code_verifier = _STATES.pop(f"cv_{state}", None)
    if not user_id:
        return RedirectResponse(f"{FRONTEND_URL}/settings?tiktok_error=invalid_state")

    # Exchange code for token
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                TT_TOKEN,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "client_key":     CLIENT_KEY,
                    "client_secret":  CLIENT_SECRET,
                    "code":           code,
                    "grant_type":     "authorization_code",
                    "redirect_uri":   REDIRECT_URI,
                    "code_verifier":  code_verifier or "",
                }
            )
            d = r.json()
            print(f"[TikTok Callback] Token: {d}")

        if "error" in d or d.get("error_code", 0) != 0:
            err = d.get("message", d.get("error", "token_failed"))
            return RedirectResponse(f"{FRONTEND_URL}/settings?tiktok_error={err}")

        data          = d.get("data", d)
        access_token  = data.get("access_token", "")
        refresh_token = data.get("refresh_token", "")
        open_id       = data.get("open_id", "")
        expires_in    = data.get("expires_in", 86400)

    except Exception as e:
        print(f"[TikTok Callback] Error: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/settings?tiktok_error=token_failed")

    # Get profile info
    username = display_name = avatar = ""
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            pr = await c.get(
                f"{TT_API}/user/info/",
                params={"fields": "open_id,union_id,avatar_url,display_name,username"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            pd = pr.json()
            ud = pd.get("data", {}).get("user", {})
            username     = ud.get("username", "")
            display_name = ud.get("display_name", "")
            avatar       = ud.get("avatar_url", "")
    except Exception as e:
        print(f"[TikTok] Profile fetch failed: {e}")

    # Save to Supabase
    try:
        sb.table("tiktok_connections").upsert({
            "user_id":       user_id,
            "access_token":  access_token,
            "refresh_token": refresh_token,
            "open_id":       open_id,
            "username":      username,
            "display_name":  display_name,
            "avatar":        avatar,
            "expires_in":    expires_in,
            "connected_at":  "now()",
        }, on_conflict="user_id").execute()
    except Exception as e:
        print(f"[TikTok] Supabase save failed: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/settings?tiktok_error=db_failed")

    return RedirectResponse(f"{FRONTEND_URL}/settings?tiktok_connected=true")


# ─────────────────────────────────────────────────────────────────────────────
# 3. STATUS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/status/{user_id}")
async def tiktok_status(user_id: str, sb=Depends(get_sb)):
    try:
        r = sb.table("tiktok_connections") \
            .select("open_id,username,display_name,avatar,connected_at") \
            .eq("user_id", user_id) \
            .maybe_single().execute()
    except Exception:
        r = None

    if not r or not r.data:
        return {"connected": False}

    return {
        "connected":    True,
        "open_id":      r.data.get("open_id"),
        "username":     r.data.get("username"),
        "display_name": r.data.get("display_name"),
        "avatar":       r.data.get("avatar"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. DISCONNECT
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/disconnect/{user_id}")
async def tiktok_disconnect(user_id: str, sb=Depends(get_sb)):
    sb.table("tiktok_connections").delete().eq("user_id", user_id).execute()
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# 5. GET USER INFO + STATS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/profile/{user_id}")
async def tiktok_profile(user_id: str, sb=Depends(get_sb)):
    token, open_id = get_token(user_id, sb)

    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(
            f"{TT_API}/user/info/",
            params={"fields": "open_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count,bio_description,profile_web_link,is_verified"},
            headers={"Authorization": f"Bearer {token}"},
        )
        d = r.json()

    if d.get("error", {}).get("code", "ok") != "ok":
        raise HTTPException(400, f"TikTok error: {d['error']['message']}")

    user = d.get("data", {}).get("user", {})
    return {
        "username":     user.get("username"),
        "display_name": user.get("display_name"),
        "avatar":       user.get("avatar_url"),
        "bio":          user.get("bio_description"),
        "website":      user.get("profile_web_link"),
        "verified":     user.get("is_verified", False),
        "followers":    user.get("follower_count", 0),
        "following":    user.get("following_count", 0),
        "likes":        user.get("likes_count", 0),
        "videos":       user.get("video_count", 0),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. GET MY VIDEOS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/videos/{user_id}")
async def tiktok_videos(user_id: str, max_count: int = 20, sb=Depends(get_sb)):
    token, _ = get_token(user_id, sb)

    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            f"{TT_API}/video/list/",
            params={"fields": "id,title,cover_image_url,share_url,view_count,like_count,comment_count,share_count,duration,create_time"},
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"max_count": max_count},
        )
        d = r.json()

    if d.get("error", {}).get("code", "ok") != "ok":
        return {"videos": [], "error": d.get("error", {}).get("message", "Failed")}

    videos = []
    for v in d.get("data", {}).get("videos", []):
        videos.append({
            "id":        v.get("id"),
            "title":     v.get("title", ""),
            "cover":     v.get("cover_image_url", ""),
            "url":       v.get("share_url", ""),
            "views":     v.get("view_count", 0),
            "likes":     v.get("like_count", 0),
            "comments":  v.get("comment_count", 0),
            "shares":    v.get("share_count", 0),
            "duration":  v.get("duration", 0),
            "created":   v.get("create_time", 0),
        })

    return {"videos": videos, "total": len(videos)}


# ─────────────────────────────────────────────────────────────────────────────
# 7. UPLOAD VIDEO (Direct Post)
# ─────────────────────────────────────────────────────────────────────────────
class UploadRequest(BaseModel):
    user_id:      str
    title:        str
    video_url:    str
    privacy:      str = "SELF_ONLY"
    disable_duet: bool = False
    disable_stitch: bool = False
    disable_comment: bool = False


# ─────────────────────────────────────────────────────────────────────────────
# 7b. UPLOAD VIDEO — Direct file (no domain verify needed)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload-file")
async def tiktok_upload_file(
    user_id:         str        = Form(...),
    title:           str        = Form(...),
    privacy:         str        = Form("SELF_ONLY"),
    disable_duet:    bool       = Form(False),
    disable_stitch:  bool       = Form(False),
    disable_comment: bool       = Form(False),
    file:            UploadFile = File(...),
    sb = Depends(get_sb)
):
    """Upload video directly to TikTok — no domain verify needed."""
    token, _ = get_token(user_id, sb)

    # Read file
    video_bytes = await file.read()
    video_size  = len(video_bytes)
    print(f"[TikTok Direct Upload] File size: {video_size} bytes")

    if video_size == 0:
        raise HTTPException(400, "Empty file.")

    # Chunk size — TikTok max 64MB per chunk
    chunk_size = min(video_size, 64 * 1024 * 1024)
    total_chunks = (video_size + chunk_size - 1) // chunk_size

    # Step 1: Init
    async with httpx.AsyncClient(timeout=30) as c:
        init_r = await c.post(
            f"{TT_API}/post/publish/video/init/",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "post_info": {
                    "title":           title[:150],
                    "privacy_level":   privacy,
                    "disable_duet":    disable_duet,
                    "disable_stitch":  disable_stitch,
                    "disable_comment": disable_comment,
                },
                "source_info": {
                    "source":            "FILE_UPLOAD",
                    "video_size":        video_size,
                    "chunk_size":        chunk_size,
                    "total_chunk_count": total_chunks,
                }
            }
        )
        init_d = init_r.json()
        print(f"[TikTok Init] {init_d}")

    err = init_d.get("error", {})
    if err.get("code", "ok") != "ok":
        raise HTTPException(400, f"TikTok init failed: {err.get('message', str(init_d))}")

    data       = init_d.get("data", {})
    publish_id = data.get("publish_id", "")
    upload_url = data.get("upload_url", "")

    if not upload_url:
        raise HTTPException(400, "No upload URL from TikTok.")

    # Step 2: Upload chunks
    for i in range(total_chunks):
        start = i * chunk_size
        end   = min(start + chunk_size, video_size)
        chunk = video_bytes[start:end]

        async with httpx.AsyncClient(timeout=300) as c:
            up_r = await c.put(
                upload_url,
                content=chunk,
                headers={
                    "Content-Type":   "video/mp4",
                    "Content-Length": str(len(chunk)),
                    "Content-Range":  f"bytes {start}-{end-1}/{video_size}",
                }
            )
            print(f"[TikTok Chunk {i+1}/{total_chunks}] Status: {up_r.status_code}")

        if up_r.status_code not in [200, 201, 206]:
            raise HTTPException(400, f"Chunk upload failed: {up_r.status_code} — {up_r.text[:200]}")

    return {
        "success":    True,
        "publish_id": publish_id,
        "message":    "Uploaded to TikTok! ✅ Open TikTok app to review and publish.",
    }

@router.post("/upload")
async def tiktok_upload(body: UploadRequest, sb=Depends(get_sb)):
    """Upload video to TikTok via file chunks (push_by_file)."""
    token, _ = get_token(body.user_id, sb)

    # Download video from Supabase URL
    try:
        async with httpx.AsyncClient(timeout=120) as c:
            video_r = await c.get(body.video_url)
            video_bytes = video_r.content
            video_size  = len(video_bytes)
        print(f"[TikTok Upload] Downloaded {video_size} bytes")
    except Exception as e:
        raise HTTPException(400, f"Could not download video: {str(e)}")

    # Step 1: Init upload
    async with httpx.AsyncClient(timeout=30) as c:
        init_r = await c.post(
            f"{TT_API}/post/publish/video/init/",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "post_info": {
                    "title":           body.title[:150],
                    "privacy_level":   body.privacy,
                    "disable_duet":    body.disable_duet,
                    "disable_stitch":  body.disable_stitch,
                    "disable_comment": body.disable_comment,
                },
                "source_info": {
                    "source":     "FILE_UPLOAD",
                    "video_size": video_size,
                    "chunk_size": video_size,  # single chunk
                    "total_chunk_count": 1,
                }
            }
        )
        init_d = init_r.json()
        print(f"[TikTok Init] {init_d}")

    if init_d.get("error", {}).get("code", "ok") != "ok":
        raise HTTPException(400, f"TikTok init failed: {init_d.get('error', {}).get('message', 'Unknown')}")

    data        = init_d.get("data", {})
    publish_id  = data.get("publish_id", "")
    upload_url  = data.get("upload_url", "")

    if not upload_url:
        raise HTTPException(400, "No upload URL returned from TikTok.")

    # Step 2: Upload video chunk
    async with httpx.AsyncClient(timeout=300) as c:
        up_r = await c.put(
            upload_url,
            content=video_bytes,
            headers={
                "Content-Type":         "video/mp4",
                "Content-Length":       str(video_size),
                "Content-Range":        f"bytes 0-{video_size-1}/{video_size}",
            }
        )
        print(f"[TikTok Chunk Upload] Status: {up_r.status_code}")

    if up_r.status_code not in [200, 201, 206]:
        raise HTTPException(400, f"TikTok chunk upload failed: {up_r.status_code}")

    return {
        "success":    True,
        "publish_id": publish_id,
        "message":    "Video uploaded to TikTok! ✅ Open TikTok app to review and publish.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 8. WEBHOOK
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/webhook")
async def tiktok_webhook(request: Request):
    body = await request.json()
    print(f"[TikTok Webhook] {body}")
    return {"message": "ok"}
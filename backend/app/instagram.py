# backend/app/instagram.py
# Instagram Platform API 2024 — NO Facebook Page needed
# Direct Instagram OAuth with instagram_business_basic scope
#
# Add to main.py:
#   from app.instagram import router as instagram_router
#   app.include_router(instagram_router)

import os
import httpx
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client
import uuid
import secrets

router = APIRouter(prefix="/api/instagram", tags=["Instagram"])

# ── Config ────────────────────────────────────────────────────────────────────
APP_ENV       = os.environ.get("APP_ENV", "production")
IS_LOCAL      = APP_ENV == "local"

APP_ID        = os.environ.get("INSTAGRAM_APP_ID") or os.environ.get("VITE_INSTAGRAM_APP_ID", "1296497079055764")
APP_SECRET    = os.environ.get("INSTAGRAM_APP_SECRET", "7ea157a23566f8410c96a5604945379f")

LOCAL_REDIRECT = "http://localhost:8000/api/instagram/callback"
PROD_REDIRECT  = "https://creator-os-production-0bf8.up.railway.app/api/instagram/callback"
REDIRECT_URI   = LOCAL_REDIRECT if IS_LOCAL else PROD_REDIRECT

LOCAL_FRONTEND = "http://localhost:5173"
PROD_FRONTEND  = "https://creator-os-ochre.vercel.app"
FRONTEND_URL   = LOCAL_FRONTEND if IS_LOCAL else PROD_FRONTEND

# Instagram Platform API endpoints
IG_AUTH    = "https://api.instagram.com/oauth/authorize"
IG_TOKEN   = "https://api.instagram.com/oauth/access_token"
IG_GRAPH   = "https://graph.facebook.com/v19.0"
IG_REFRESH = "https://graph.facebook.com/v19.0/oauth/access_token"

# State store
_STATES: dict = {}

# ── Supabase ──────────────────────────────────────────────────────────────────
def get_sb():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )

def get_token(user_id: str, sb) -> tuple[str, str]:
    """Returns (access_token, ig_user_id) — checks both tables"""
    # Check instagram_connections (new table)
    try:
        r = sb.table("instagram_connections")             .select("access_token, ig_user_id")             .eq("user_id", user_id)             .maybe_single().execute()
        if r and r.data and r.data.get("access_token"):
            return r.data["access_token"], r.data["ig_user_id"]
    except Exception:
        pass

    # Check social_connections (old table)
    try:
        r2 = sb.table("social_connections")             .select("access_token, platform_user_id")             .eq("user_id", user_id)             .eq("platform", "instagram")             .maybe_single().execute()
        if r2 and r2.data and r2.data.get("access_token"):
            return r2.data["access_token"], r2.data["platform_user_id"]
    except Exception:
        pass

    # Fallback to env vars
    tok = os.environ.get("INSTAGRAM_TEST_ACCESS_TOKEN")
    uid = os.environ.get("INSTAGRAM_TEST_USER_ID")
    if tok and uid:
        return tok, uid

    raise HTTPException(401, "Instagram not connected. Go to Settings → Connect Instagram.")


# ─────────────────────────────────────────────────────────────────────────────
# AUTO REFRESH — Extend token before it expires
# ─────────────────────────────────────────────────────────────────────────────
async def refresh_token_if_needed(token: str) -> str:
    """
    Refresh Instagram/Facebook long-lived token.
    Call this before using token to keep it alive.
    Long-lived tokens can be refreshed if they have at least 1 day left.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(
                "https://graph.facebook.com/v19.0/oauth/access_token",
                params={
                    "grant_type":    "fb_exchange_token",
                    "client_id":     APP_ID,
                    "client_secret": APP_SECRET,
                    "fb_exchange_token": token,
                }
            )
            d = r.json()
            if "access_token" in d:
                print(f"[Instagram] Token refreshed! New expires_in: {d.get('expires_in', 'unknown')}")
                return d["access_token"]
    except Exception as e:
        print(f"[Instagram] Token refresh failed: {e}")
    return token


# ─────────────────────────────────────────────────────────────────────────────
# 1. OAUTH START — Instagram Platform API (no Facebook needed)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/auth")
async def instagram_auth(user_id: str):
    """Start Instagram OAuth — direct login, no Facebook Page needed."""
    from urllib.parse import urlencode

    state = secrets.token_urlsafe(16)
    _STATES[state] = user_id

    params = {
        "client_id":     APP_ID,
        "redirect_uri":  REDIRECT_URI,
        "scope":         "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages",
        "response_type": "code",
        "state":         state,
    }
    auth_url = f"{IG_AUTH}?{urlencode(params)}"
    print(f"[Instagram Auth] OAuth started for user={user_id[:8]}...")
    return RedirectResponse(auth_url)


# ─────────────────────────────────────────────────────────────────────────────
# 2. OAUTH CALLBACK
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/callback")
async def instagram_callback(request: Request, sb=Depends(get_sb)):
    """Handle Instagram OAuth callback."""
    params  = dict(request.query_params)
    code    = params.get("code")
    state   = params.get("state")
    error   = params.get("error")

    if error:
        return RedirectResponse(f"{FRONTEND_URL}/instagram?error={error}")

    user_id = _STATES.pop(state, None)
    if not user_id:
        return RedirectResponse(f"{FRONTEND_URL}/instagram?error=invalid_state")

    # Exchange code for short-lived token
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                IG_TOKEN,
                data={
                    "client_id":     APP_ID,
                    "client_secret": APP_SECRET,
                    "grant_type":    "authorization_code",
                    "redirect_uri":  REDIRECT_URI,
                    "code":          code,
                },
            )
            token_data = r.json()
            print(f"[Instagram Callback] Token keys: {list(token_data.keys())}")

        if "error_type" in token_data or "error" in token_data:
            err = token_data.get("error_message") or token_data.get("error", "token_failed")
            return RedirectResponse(f"{FRONTEND_URL}/instagram?error={err}")

        short_token = token_data["access_token"]
        ig_user_id  = str(token_data["user_id"])

    except Exception as e:
        print(f"[Instagram Callback] Token exchange failed: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/instagram?error=token_failed")

    # Use token directly (Facebook Graph API tokens are already long-lived)
    long_token = short_token
    expires_in = 5184000

    # Get profile info
    username = name = picture = ""
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(
                f"{IG_GRAPH}/{ig_user_id}",
                params={
                    "fields":       "id,username,name,profile_picture_url,followers_count,media_count,account_type",
                    "access_token": long_token,
                },
            )
            profile  = r.json()
            username = profile.get("username", "")
            name     = profile.get("name", "")
            picture  = profile.get("profile_picture_url", "")
            print(f"[Instagram Callback] Profile: @{username}")
    except Exception as e:
        print(f"[Instagram Callback] Profile fetch failed: {e}")

    # Save to Supabase
    try:
        sb.table("instagram_connections").upsert({
            "user_id":      user_id,
            "access_token": long_token,
            "ig_user_id":   ig_user_id,
            "username":     username,
            "name":         name,
            "picture":      picture,
            "expires_in":   expires_in,
            "connected_at": "now()",
        }, on_conflict="user_id").execute()
        print(f"[Instagram Callback] Saved to Supabase!")
    except Exception as e:
        print(f"[Instagram Callback] Supabase failed: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/instagram?error=db_save_failed")

    return RedirectResponse(f"{FRONTEND_URL}/instagram?connected=true")


# ─────────────────────────────────────────────────────────────────────────────
# 3. STATUS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/status/{user_id}")
async def instagram_status(user_id: str, sb=Depends(get_sb)):
    # Check instagram_connections table (new)
    try:
        r = sb.table("instagram_connections")             .select("ig_user_id,username,name,picture,connected_at")             .eq("user_id", user_id)             .maybe_single().execute()
        if r and r.data and r.data.get("ig_user_id"):
            return {
                "connected":  True,
                "ig_user_id": r.data.get("ig_user_id"),
                "username":   r.data.get("username"),
                "name":       r.data.get("name"),
                "picture":    r.data.get("picture"),
            }
    except Exception:
        pass

    # Fallback: check social_connections table (old)
    try:
        r2 = sb.table("social_connections")             .select("platform_user_id,username,access_token")             .eq("user_id", user_id)             .eq("platform", "instagram")             .maybe_single().execute()
        if r2 and r2.data and r2.data.get("access_token"):
            return {
                "connected":  True,
                "ig_user_id": r2.data.get("platform_user_id"),
                "username":   r2.data.get("username", "dreambyte"),
                "name":       r2.data.get("username", "dreambyte"),
                "picture":    "",
            }
    except Exception:
        pass

    # Fallback: check env vars
    tok = os.environ.get("INSTAGRAM_TEST_ACCESS_TOKEN")
    uid = os.environ.get("INSTAGRAM_TEST_USER_ID")
    if tok and uid:
        return {
            "connected":  True,
            "ig_user_id": uid,
            "username":   "dreambyte",
            "name":       "dreambyte",
            "picture":    "",
        }

    return {"connected": False}


# ─────────────────────────────────────────────────────────────────────────────
# 4. DISCONNECT
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/disconnect/{user_id}")
async def instagram_disconnect(user_id: str, sb=Depends(get_sb)):
    sb.table("instagram_connections").delete().eq("user_id", user_id).execute()
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# 5. CONNECT — Manual token entry (for existing token)
# ─────────────────────────────────────────────────────────────────────────────
class ConnectRequest(BaseModel):
    user_id:      str
    access_token: str
    ig_user_id:   str

@router.post("/connect")
async def connect_instagram(body: ConnectRequest, sb=Depends(get_sb)):
    """Save manually entered token to Supabase."""
    tok = body.access_token
    uid = body.ig_user_id

    # Verify token works
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            f"{IG_GRAPH}/{uid}",
            params={"fields": "id,username,name,profile_picture_url", "access_token": tok},
        )
        d = r.json()

    if "error" in d:
        raise HTTPException(400, f"Invalid token: {d['error']['message']}")

    sb.table("instagram_connections").upsert({
        "user_id":      body.user_id,
        "access_token": tok,
        "ig_user_id":   uid,
        "username":     d.get("username", ""),
        "name":         d.get("name", ""),
        "picture":      d.get("profile_picture_url", ""),
        "connected_at": "now()",
    }, on_conflict="user_id").execute()

    return {"success": True, "username": d.get("username"), "message": "Instagram connected!"}


# ─────────────────────────────────────────────────────────────────────────────
# 6. ANALYTICS / PROFILE
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/analytics/{user_id}")
async def get_analytics(user_id: str, sb=Depends(get_sb)):
    tok, ig_uid = get_token(user_id, sb)

    async with httpx.AsyncClient(timeout=20) as c:
        # Profile
        profile_r = await c.get(
            f"{IG_GRAPH}/{ig_uid}",
            params={
                "fields":       "id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count,account_type",
                "access_token": tok,
            },
        )
        # Recent media
        media_r = await c.get(
            f"{IG_GRAPH}/{ig_uid}/media",
            params={
                "fields":       "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
                "limit":        12,
                "access_token": tok,
            },
        )

    profile = profile_r.json()
    media   = media_r.json()

    if "error" in profile:
        raise HTTPException(400, f"Instagram error: {profile['error']['message']}")

    posts = []
    for m in media.get("data", []):
        likes    = m.get("like_count", 0)
        comments = m.get("comments_count", 0)
        posts.append({
            "id":         m["id"],
            "caption":    (m.get("caption") or "")[:150],
            "type":       m.get("media_type", "IMAGE"),
            "url":        m.get("media_url") or m.get("thumbnail_url", ""),
            "permalink":  m.get("permalink", ""),
            "timestamp":  m.get("timestamp", ""),
            "likes":      likes,
            "comments":   comments,
            "engagement": likes + comments,
        })

    return {
        "account": {
            "id":          profile.get("id"),
            "username":    profile.get("username"),
            "name":        profile.get("name"),
            "bio":         profile.get("biography"),
            "website":     profile.get("website"),
            "picture":     profile.get("profile_picture_url"),
            "followers":   profile.get("followers_count", 0),
            "following":   profile.get("follows_count", 0),
            "media_count": profile.get("media_count", 0),
            "type":        profile.get("account_type"),
        },
        "top_posts":    sorted(posts, key=lambda x: x["engagement"], reverse=True)[:6],
        "recent_posts": posts,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 7. GET MEDIA / POSTS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/media/{user_id}")
async def get_media(user_id: str, limit: int = 20, sb=Depends(get_sb)):
    tok, ig_uid = get_token(user_id, sb)

    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(
            f"{IG_GRAPH}/{ig_uid}/media",
            params={
                "fields":       "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
                "limit":        limit,
                "access_token": tok,
            },
        )
    d = r.json()
    if "error" in d:
        raise HTTPException(400, d["error"]["message"])

    posts = []
    for m in d.get("data", []):
        posts.append({
            "id":        m["id"],
            "caption":   (m.get("caption") or "")[:200],
            "type":      m.get("media_type", "IMAGE"),
            "url":       m.get("media_url") or m.get("thumbnail_url", ""),
            "permalink": m.get("permalink", ""),
            "timestamp": m.get("timestamp", ""),
            "likes":     m.get("like_count", 0),
            "comments":  m.get("comments_count", 0),
        })

    return {"posts": posts, "total": len(posts)}


# ─────────────────────────────────────────────────────────────────────────────
# 8. UPLOAD IMAGE TO SUPABASE → return public URL
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload-image")
async def upload_image(
    user_id: str        = Form(...),
    file:    UploadFile = File(...),
    sb = Depends(get_sb)
):
    allowed = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed:
        raise HTTPException(400, "Only JPG and PNG supported.")

    content  = await file.read()
    ext      = "png" if "png" in file.content_type else "jpg"
    filename = f"instagram/{user_id}/{uuid.uuid4()}.{ext}"

    try:
        sb.storage.from_("posts").upload(
            filename, content,
            {"content-type": file.content_type, "upsert": "true"}
        )
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")

    supabase_url = os.environ["SUPABASE_URL"]
    public_url   = f"{supabase_url}/storage/v1/object/public/posts/{filename}"
    return {"url": public_url}


# ─────────────────────────────────────────────────────────────────────────────
# 9. POST TO INSTAGRAM FEED
# ─────────────────────────────────────────────────────────────────────────────
class PostRequest(BaseModel):
    user_id:    str
    caption:    str
    image_url:  Optional[str]       = None
    image_urls: Optional[List[str]] = None  # carousel

@router.post("/post")
async def post_to_instagram(body: PostRequest, sb=Depends(get_sb)):
    tok, ig_uid = get_token(body.user_id, sb)

    async with httpx.AsyncClient(timeout=60) as c:
        # Carousel (2-10 images)
        if body.image_urls and len(body.image_urls) >= 2:
            items = []
            for url in body.image_urls[:10]:
                r = await c.post(
                    f"{IG_GRAPH}/{ig_uid}/media",
                    params={"image_url": url, "is_carousel_item": "true", "access_token": tok}
                )
                d = r.json()
                if "error" in d:
                    raise HTTPException(400, f"Container error: {d['error']['message']}")
                items.append(d["id"])

            r = await c.post(
                f"{IG_GRAPH}/{ig_uid}/media",
                params={
                    "media_type":   "CAROUSEL",
                    "children":     ",".join(items),
                    "caption":      body.caption,
                    "access_token": tok,
                }
            )
            d = r.json()
            if "error" in d:
                raise HTTPException(400, d["error"]["message"])
            container_id = d["id"]

        # Single image
        elif body.image_url:
            r = await c.post(
                f"{IG_GRAPH}/{ig_uid}/media",
                params={"image_url": body.image_url, "caption": body.caption, "access_token": tok}
            )
            d = r.json()
            if "error" in d:
                raise HTTPException(400, f"Container error: {d['error']['message']}")
            container_id = d["id"]

        else:
            raise HTTPException(400, "image_url is required.")

        # Wait for Instagram to process the media
        import asyncio
        await asyncio.sleep(5)

        # Publish
        pub_r = await c.post(
            f"{IG_GRAPH}/{ig_uid}/media_publish",
            params={"creation_id": container_id, "access_token": tok}
        )
        pub_d = pub_r.json()
        if "error" in pub_d:
            raise HTTPException(400, f"Publish error: {pub_d['error']['message']}")

        post_id = pub_d["id"]

        # Get permalink
        permalink = ""
        try:
            pl_r = await c.get(
                f"{IG_GRAPH}/{post_id}",
                params={"fields": "permalink", "access_token": tok}
            )
            permalink = pl_r.json().get("permalink", "")
        except Exception:
            pass

    return {
        "success":   True,
        "post_id":   post_id,
        "permalink": permalink,
        "message":   "Posted to Instagram! ✅"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 10. POST STORY
# ─────────────────────────────────────────────────────────────────────────────
class StoryRequest(BaseModel):
    user_id:   str
    image_url: str

@router.post("/story")
async def post_story(body: StoryRequest, sb=Depends(get_sb)):
    tok, ig_uid = get_token(body.user_id, sb)

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            f"{IG_GRAPH}/{ig_uid}/media",
            params={"image_url": body.image_url, "media_type": "STORIES", "access_token": tok}
        )
        d = r.json()
        if "error" in d:
            raise HTTPException(400, f"Story error: {d['error']['message']}")

        pub_r = await c.post(
            f"{IG_GRAPH}/{ig_uid}/media_publish",
            params={"creation_id": d["id"], "access_token": tok}
        )
        pub_d = pub_r.json()
        if "error" in pub_d:
            raise HTTPException(400, f"Story publish error: {pub_d['error']['message']}")

    return {"success": True, "story_id": pub_d["id"], "message": "Story posted! ✅"}


# ─────────────────────────────────────────────────────────────────────────────
# 11. INBOX — Comments from recent posts
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/inbox/{user_id}")
async def get_inbox(user_id: str, limit: int = 50, sb=Depends(get_sb)):
    tok, ig_uid = get_token(user_id, sb)

    async with httpx.AsyncClient(timeout=20) as c:
        posts_r = await c.get(
            f"{IG_GRAPH}/{ig_uid}/media",
            params={"fields": "id,caption,permalink", "limit": 10, "access_token": tok}
        )
    posts        = posts_r.json().get("data", [])
    all_comments = []

    async with httpx.AsyncClient(timeout=30) as c:
        for post in posts[:8]:
            try:
                cr = await c.get(
                    f"{IG_GRAPH}/{post['id']}/comments",
                    params={
                        "fields":       "id,text,username,timestamp,replies{id,text,username,timestamp}",
                        "limit":        50,
                        "access_token": tok,
                    }
                )
                for cmt in cr.json().get("data", []):
                    all_comments.append({
                        "id":           cmt["id"],
                        "type":         "comment",
                        "text":         cmt.get("text", ""),
                        "from":         cmt.get("username", "Unknown"),
                        "timestamp":    cmt.get("timestamp"),
                        "post_id":      post["id"],
                        "post_url":     post.get("permalink", ""),
                        "post_caption": (post.get("caption") or "")[:60],
                        "replied":      len(cmt.get("replies", {}).get("data", [])) > 0,
                        "replies":      cmt.get("replies", {}).get("data", []),
                    })
            except Exception:
                continue

    all_comments.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {
        "total":    len(all_comments),
        "messages": all_comments[:limit],
    }


# ─────────────────────────────────────────────────────────────────────────────
# 12. REPLY TO COMMENT
# ─────────────────────────────────────────────────────────────────────────────
class ReplyRequest(BaseModel):
    user_id:    str
    comment_id: str
    message:    str

@router.post("/reply-comment")
async def reply_to_comment(body: ReplyRequest, sb=Depends(get_sb)):
    tok, _ = get_token(body.user_id, sb)
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(
            f"{IG_GRAPH}/{body.comment_id}/replies",
            params={"message": body.message, "access_token": tok}
        )
        d = r.json()
    if "error" in d:
        raise HTTPException(400, d["error"]["message"])
    return {"success": True, "reply_id": d.get("id")}

# ─────────────────────────────────────────────────────────────────────────────
# 13. DMs / MESSAGES INBOX — Facebook Page Conversations API
# ─────────────────────────────────────────────────────────────────────────────

PAGE_ID = "1119718397895935"  # Dreambyte Facebook Page ID

@router.get("/messages/{user_id}")
async def get_messages(user_id: str, sb=Depends(get_sb)):
    """
    Get Instagram DMs via Facebook Page Conversations API.
    Requires: instagram_manage_messages + pages_messaging
    """
    tok, ig_uid = get_token(user_id, sb)

    def parse_convos(data_list):
        convos = []
        for conv in data_list:
            msgs = conv.get("messages", {}).get("data", [])
            if not msgs:
                continue
            latest = msgs[0]
            sender = latest.get("from", {})
            convos.append({
                "id":           conv["id"],
                "last_message": latest.get("message", "📎 Attachment"),
                "from":         sender.get("username") or sender.get("name", "Unknown"),
                "from_id":      sender.get("id", ""),
                "timestamp":    latest.get("created_time", ""),
                "messages": [
                    {
                        "message":      m.get("message", ""),
                        "from":         m.get("from", {}).get("username") or m.get("from", {}).get("name", ""),
                        "created_time": m.get("created_time", ""),
                    }
                    for m in msgs[:20]
                ],
            })
        return convos

    fields = "id,messages{message,from,to,created_time}"

    # Try 1: IG Business account conversations
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(
            f"{IG_GRAPH}/{ig_uid}/conversations",
            params={"platform": "instagram", "fields": fields, "access_token": tok}
        )
        d = r.json()
        print(f"[Instagram DMs] IG endpoint: {r.status_code}, data: {len(d.get('data',[]))}")

    if "error" not in d and d.get("data"):
        convos = parse_convos(d["data"])
        if convos:
            return {"conversations": convos, "total": len(convos)}

    # Try 2: Facebook Page conversations (instagram platform)
    async with httpx.AsyncClient(timeout=20) as c:
        r2 = await c.get(
            f"{IG_GRAPH}/{PAGE_ID}/conversations",
            params={"platform": "instagram", "fields": fields, "access_token": tok}
        )
        d2 = r2.json()
        print(f"[Instagram DMs] Page endpoint: {r2.status_code}, data: {len(d2.get('data',[]))}")

    if "error" not in d2:
        convos = parse_convos(d2.get("data", []))
        return {"conversations": convos, "total": len(convos)}

    # Try 3: Page inbox (messenger)
    async with httpx.AsyncClient(timeout=20) as c:
        r3 = await c.get(
            f"{IG_GRAPH}/{PAGE_ID}/conversations",
            params={"fields": fields, "access_token": tok}
        )
        d3 = r3.json()
        print(f"[Instagram DMs] Page messenger: {r3.status_code}")

    if "error" not in d3:
        convos = parse_convos(d3.get("data", []))
        return {"conversations": convos, "total": len(convos)}

    err = d2.get("error", {}).get("message", "Unknown error")
    return {
        "conversations": [],
        "total": 0,
        "note": f"DMs API error: {err}. Token may need instagram_manage_messages + pages_messaging scope."
    }


class SendMessageRequest(BaseModel):
    user_id:    str
    recipient:  str  # Instagram scoped user ID
    message:    str

@router.post("/send-message")
async def send_message(body: SendMessageRequest, sb=Depends(get_sb)):
    """Send DM reply via Instagram Messaging API."""
    tok, ig_uid = get_token(body.user_id, sb)

    # Try sending via IG user
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            f"{IG_GRAPH}/{ig_uid}/messages",
            params={"access_token": tok},
            json={
                "recipient": {"id": body.recipient},
                "message":   {"text": body.message},
            }
        )
        d = r.json()
        print(f"[Instagram Send] Status: {r.status_code}, Body: {d}")

    if "error" in d:
        # Try via Page
        async with httpx.AsyncClient(timeout=20) as c:
            r2 = await c.post(
                f"{IG_GRAPH}/{PAGE_ID}/messages",
                params={"access_token": tok},
                json={
                    "recipient": {"id": body.recipient},
                    "message":   {"text": body.message},
                }
            )
            d2 = r2.json()
        if "error" in d2:
            raise HTTPException(400, f"Send failed: {d2['error']['message']}")
        return {"success": True, "message_id": d2.get("message_id")}

    return {"success": True, "message_id": d.get("message_id")}
# instagram.py — Complete Instagram Integration for Nexora OS
# Railway URL: https://creator-os-production-0bf8.up.railway.app
# Images: Supabase Storage (bucket: "posts" — must be PUBLIC)
#
# Add to main.py:
#   from instagram import router as instagram_router
#   app.include_router(instagram_router)

import os
import httpx
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client
import uuid

router = APIRouter(prefix="/api/instagram", tags=["Instagram"])

GRAPH_VERSION = "v19.0"
GRAPH         = f"https://graph.facebook.com/{GRAPH_VERSION}"

# ── Supabase client (uses service key — server side only) ─────────────────────
def get_sb():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )

# ── Fetch token + ig_user_id from social_connections table ────────────────────
def get_token(user_id: str, sb) -> tuple[str, str]:
    r = sb.table("social_connections") \
        .select("access_token, platform_user_id") \
        .eq("user_id", user_id) \
        .eq("platform", "instagram") \
        .maybe_single().execute()

    if r.data and r.data.get("access_token"):
        return r.data["access_token"], r.data["platform_user_id"]

    # Dev tester fallback from Railway env vars
    tok = os.environ.get("INSTAGRAM_TEST_ACCESS_TOKEN")
    uid = os.environ.get("INSTAGRAM_TEST_USER_ID")
    if tok and uid:
        return tok, uid

    raise HTTPException(
        status_code=400,
        detail="Instagram not connected. Go to Settings and connect your Instagram account."
    )

# ─────────────────────────────────────────────────────────────────────────────
# 1. UPLOAD IMAGE TO SUPABASE STORAGE → returns public URL
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload-image")
async def upload_image(
    user_id: str      = Form(...),
    file:    UploadFile = File(...),
    sb = Depends(get_sb)
):
    """
    Upload image to Supabase Storage bucket 'posts'.
    Returns a public URL that Instagram can fetch.
    Bucket MUST be set to Public in Supabase Dashboard → Storage.
    """
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only JPG and PNG are supported by Instagram.")

    content  = await file.read()
    ext      = "png" if "png" in file.content_type else "jpg"
    filename = f"instagram/{user_id}/{uuid.uuid4()}.{ext}"

    # Upload to Supabase Storage
    try:
        sb.storage.from_("posts").upload(
            filename,
            content,
            {"content-type": file.content_type, "upsert": "true"}
        )
    except Exception as e:
        raise HTTPException(500, f"Supabase Storage upload failed: {str(e)}. Make sure 'posts' bucket exists and is public.")

    # Build public URL
    # Format: https://[project].supabase.co/storage/v1/object/public/posts/[filename]
    supabase_url = os.environ["SUPABASE_URL"]
    public_url   = f"{supabase_url}/storage/v1/object/public/posts/{filename}"

    return {"url": public_url, "filename": filename}


# ─────────────────────────────────────────────────────────────────────────────
# 2. POST TO INSTAGRAM FEED (image or carousel)
# ─────────────────────────────────────────────────────────────────────────────
class PostRequest(BaseModel):
    user_id:    str
    caption:    str
    image_url:  Optional[str]       = None   # single image
    image_urls: Optional[List[str]] = None   # carousel (2–10 images)

class PostResponse(BaseModel):
    success:   bool
    post_id:   Optional[str] = None
    permalink: Optional[str] = None
    message:   str

async def _create_container(ig_uid, tok, image_url, caption="", is_item=False):
    params = {"image_url": image_url, "access_token": tok}
    if is_item:
        params["is_carousel_item"] = "true"
    else:
        params["caption"] = caption
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(f"{GRAPH}/{ig_uid}/media", params=params)
        d = r.json()
    if "error" in d:
        raise HTTPException(400, f"IG container error: {d['error']['message']}")
    return d["id"]

async def _publish_container(ig_uid, tok, container_id):
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            f"{GRAPH}/{ig_uid}/media_publish",
            params={"creation_id": container_id, "access_token": tok}
        )
        d = r.json()
    if "error" in d:
        raise HTTPException(400, f"IG publish error: {d['error']['message']}")
    return d["id"]

async def _get_permalink(post_id, tok):
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"{GRAPH}/{post_id}",
                        params={"fields": "permalink", "access_token": tok})
    return r.json().get("permalink", "")

async def _check_rate_limit(ig_uid, tok):
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(
            f"{GRAPH}/{ig_uid}/content_publishing_limit",
            params={"fields": "quota_usage", "access_token": tok}
        )
    used = r.json().get("data", [{}])[0].get("quota_usage", 0)
    if used >= 25:
        raise HTTPException(429, "Instagram daily limit reached (25 posts/day). Try again tomorrow.")


@router.post("/post", response_model=PostResponse)
async def post_to_instagram(body: PostRequest, sb=Depends(get_sb)):
    tok, ig_uid = get_token(body.user_id, sb)

    await _check_rate_limit(ig_uid, tok)

    # Carousel (2–10 images)
    if body.image_urls and len(body.image_urls) >= 2:
        items = []
        for url in body.image_urls[:10]:
            items.append(await _create_container(ig_uid, tok, url, is_item=True))

        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                f"{GRAPH}/{ig_uid}/media",
                params={
                    "media_type": "CAROUSEL",
                    "children":   ",".join(items),
                    "caption":    body.caption,
                    "access_token": tok,
                }
            )
            d = r.json()
        if "error" in d:
            raise HTTPException(400, d["error"]["message"])
        container_id = d["id"]

    # Single image
    else:
        if not body.image_url:
            raise HTTPException(400, "image_url is required.")
        container_id = await _create_container(ig_uid, tok, body.image_url, body.caption)

    post_id   = await _publish_container(ig_uid, tok, container_id)
    permalink = await _get_permalink(post_id, tok)

    # Log to Supabase
    sb.table("scheduled_posts").insert({
        "user_id":      body.user_id,
        "title":        body.caption[:80],
        "content":      body.caption,
        "platform":     "instagram",
        "scheduled_at": "now()",
        "status":       "published",
    }).execute()

    return PostResponse(
        success=True, post_id=post_id, permalink=permalink,
        message="Posted to Instagram successfully!"
    )


# ─────────────────────────────────────────────────────────────────────────────
# 3. POST INSTAGRAM STORY
# ─────────────────────────────────────────────────────────────────────────────
class StoryRequest(BaseModel):
    user_id:   str
    image_url: str   # 9:16 ratio (1080×1920) recommended

@router.post("/story")
async def post_story(body: StoryRequest, sb=Depends(get_sb)):
    tok, ig_uid = get_token(body.user_id, sb)

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            f"{GRAPH}/{ig_uid}/media",
            params={
                "image_url":    body.image_url,
                "media_type":   "STORIES",
                "access_token": tok,
            }
        )
        d = r.json()

    if "error" in d:
        raise HTTPException(400, f"Story error: {d['error']['message']}")

    story_id = await _publish_container(ig_uid, tok, d["id"])

    return {
        "success":  True,
        "story_id": story_id,
        "message":  "Story posted to Instagram!"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/analytics/{user_id}")
async def get_analytics(user_id: str, sb=Depends(get_sb)):
    tok, ig_uid = get_token(user_id, sb)

    async with httpx.AsyncClient(timeout=20) as c:
        acc_r = await c.get(
            f"{GRAPH}/{ig_uid}",
            params={
                "fields":       "username,followers_count,follows_count,media_count,profile_picture_url,biography,website",
                "access_token": tok,
            }
        )
        ins_r = await c.get(
            f"{GRAPH}/{ig_uid}/insights",
            params={
                "metric":       "impressions,reach,profile_views,website_clicks,follower_count",
                "period":       "day",
                "since":        "30 days ago",
                "access_token": tok,
            }
        )
        media_r = await c.get(
            f"{GRAPH}/{ig_uid}/media",
            params={
                "fields":       "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
                "limit":        12,
                "access_token": tok,
            }
        )

    acc   = acc_r.json()
    ins   = ins_r.json()
    media = media_r.json()

    # Aggregate insights
    insights = {}
    for item in ins.get("data", []):
        insights[item["name"]] = sum(v.get("value", 0) for v in item.get("values", []))

    # Posts list
    posts = []
    for m in media.get("data", []):
        likes    = m.get("like_count", 0)
        comments = m.get("comments_count", 0)
        posts.append({
            "id":         m["id"],
            "caption":    (m.get("caption") or "")[:100],
            "type":       m.get("media_type"),
            "url":        m.get("media_url") or m.get("thumbnail_url"),
            "permalink":  m.get("permalink"),
            "timestamp":  m.get("timestamp"),
            "likes":      likes,
            "comments":   comments,
            "engagement": likes + comments,
        })

    return {
        "account": {
            "username":    acc.get("username"),
            "followers":   acc.get("followers_count", 0),
            "following":   acc.get("follows_count", 0),
            "media_count": acc.get("media_count", 0),
            "profile_pic": acc.get("profile_picture_url"),
            "bio":         acc.get("biography"),
            "website":     acc.get("website"),
        },
        "insights_30d": {
            "impressions":    insights.get("impressions", 0),
            "reach":          insights.get("reach", 0),
            "profile_views":  insights.get("profile_views", 0),
            "website_clicks": insights.get("website_clicks", 0),
            "new_followers":  insights.get("follower_count", 0),
        },
        "top_posts":    sorted(posts, key=lambda x: x["engagement"], reverse=True)[:6],
        "recent_posts": posts,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. INBOX — Comments across recent posts
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/inbox/{user_id}")
async def get_inbox(user_id: str, limit: int = 30, sb=Depends(get_sb)):
    tok, ig_uid = get_token(user_id, sb)

    async with httpx.AsyncClient(timeout=20) as c:
        posts_r = await c.get(
            f"{GRAPH}/{ig_uid}/media",
            params={"fields": "id,caption,permalink", "limit": 8, "access_token": tok}
        )

    posts = posts_r.json().get("data", [])
    all_comments = []

    async with httpx.AsyncClient(timeout=20) as c:
        for post in posts[:5]:
            cr = await c.get(
                f"{GRAPH}/{post['id']}/comments",
                params={
                    "fields":       "id,text,username,timestamp,replies{text,username,timestamp}",
                    "limit":        20,
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
                    "post_url":     post.get("permalink"),
                    "post_caption": (post.get("caption") or "")[:60],
                    "replies":      cmt.get("replies", {}).get("data", []),
                })

    # Try DMs (requires instagram_manage_messages — may not be available in dev)
    dms = []
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            dm_r = await c.get(
                f"{GRAPH}/{ig_uid}/conversations",
                params={
                    "platform":     "instagram",
                    "fields":       "id,messages{message,from,timestamp}",
                    "access_token": tok,
                }
            )
        for convo in dm_r.json().get("data", [])[:10]:
            msgs = convo.get("messages", {}).get("data", [])
            if msgs:
                dms.append({
                    "id":           convo["id"],
                    "type":         "dm",
                    "text":         msgs[0].get("message", ""),
                    "from":         msgs[0].get("from", {}).get("name", "Unknown"),
                    "timestamp":    msgs[0].get("timestamp"),
                    "thread_count": len(msgs),
                })
    except Exception:
        pass  # DMs need app review — skip silently in dev

    all_msgs = sorted(all_comments + dms, key=lambda x: x.get("timestamp", ""), reverse=True)

    return {
        "total":    len(all_msgs),
        "comments": len(all_comments),
        "dms":      len(dms),
        "messages": all_msgs[:limit],
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. REPLY TO COMMENT
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
            f"{GRAPH}/{body.comment_id}/replies",
            params={"message": body.message, "access_token": tok}
        )
        d = r.json()
    if "error" in d:
        raise HTTPException(400, d["error"]["message"])
    return {"success": True, "reply_id": d.get("id")}


# ─────────────────────────────────────────────────────────────────────────────
# 7. CONNECT — Save token after OAuth or manual entry
# ─────────────────────────────────────────────────────────────────────────────
class ConnectRequest(BaseModel):
    user_id:      str
    access_token: str
    ig_user_id:   str

@router.post("/connect")
async def connect_instagram(body: ConnectRequest, sb=Depends(get_sb)):
    tok, ig_uid = body.access_token, body.ig_user_id

    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            f"{GRAPH}/{ig_uid}",
            params={"fields": "username,followers_count", "access_token": tok}
        )
        d = r.json()

    if "error" in d:
        raise HTTPException(400, f"Invalid token: {d['error']['message']}")

    sb.table("social_connections").upsert({
        "user_id":          body.user_id,
        "platform":         "instagram",
        "platform_user_id": ig_uid,
        "username":         d.get("username"),
        "followers":        d.get("followers_count", 0),
        "access_token":     tok,
        "connected_at":     "now()",
    }, on_conflict="user_id,platform").execute()

    return {
        "success":   True,
        "username":  d.get("username"),
        "followers": d.get("followers_count", 0),
        "message":   "Instagram connected!"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 8. STATUS CHECK
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/status/{user_id}")
async def instagram_status(user_id: str, sb=Depends(get_sb)):
    try:
        tok, ig_uid = get_token(user_id, sb)
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(
                f"{GRAPH}/{ig_uid}",
                params={"fields": "username,followers_count", "access_token": tok}
            )
            d = r.json()
        if "error" in d:
            return {"connected": False, "error": d["error"]["message"]}
        return {
            "connected": True,
            "username":  d.get("username"),
            "followers": d.get("followers_count", 0),
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}
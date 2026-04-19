# backend/app/api/youtube.py
# Complete YouTube Integration for Nexora OS
# Works on LOCAL and RAILWAY — no client_secret.json file needed
# Pure environment variables only
#
# LOCAL .env:
#   GOOGLE_CLIENT_ID=...
#   GOOGLE_CLIENT_SECRET=...
#   APP_ENV=local
#
# RAILWAY Variables:
#   GOOGLE_CLIENT_ID=...
#   GOOGLE_CLIENT_SECRET=...
#   APP_ENV=production
#
# Add to main.py:
#   from app.api.youtube import router as youtube_router
#   app.include_router(youtube_router)

import os
import tempfile
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
from supabase import create_client

# Google imports
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import google_auth_oauthlib.flow

router = APIRouter(prefix="/api/youtube", tags=["YouTube"])

# ── Detect environment — local vs Railway ─────────────────────────────────────
APP_ENV      = os.environ.get("APP_ENV", "production")
IS_LOCAL     = APP_ENV == "local"

CLIENT_ID     = os.environ.get("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")

# Redirect URI — local vs production
LOCAL_REDIRECT    = "http://localhost:8000/api/youtube/callback"
PROD_REDIRECT     = "https://creator-os-production-0bf8.up.railway.app/api/youtube/callback"
REDIRECT_URI      = LOCAL_REDIRECT if IS_LOCAL else PROD_REDIRECT

# Frontend URL — local vs production
LOCAL_FRONTEND    = "http://localhost:5173"
PROD_FRONTEND     = "https://creator-os-ochre.vercel.app"
FRONTEND_URL      = LOCAL_FRONTEND if IS_LOCAL else PROD_FRONTEND

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube.readonly",
]

# ── Client config dict — no JSON file needed ──────────────────────────────────
def get_client_config():
    return {
        "web": {
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
            "token_uri":     "https://oauth2.googleapis.com/token",
            "redirect_uris": [LOCAL_REDIRECT, PROD_REDIRECT],
        }
    }

# ── Supabase ──────────────────────────────────────────────────────────────────
def get_sb():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )

# ── Get credentials from Supabase ─────────────────────────────────────────────
def get_credentials(user_id: str, sb) -> Credentials:
    try:
        r = sb.table("youtube_connections") \
            .select("*") \
            .eq("user_id", user_id) \
            .maybe_single().execute()
    except Exception:
        r = None

    if not r or not r.data:
        raise HTTPException(
            401,
            "YouTube not connected. Please connect from Settings → Social Accounts."
        )

    data  = r.data
    creds = Credentials(
        token         = data["access_token"],
        refresh_token = data.get("refresh_token"),
        token_uri     = "https://oauth2.googleapis.com/token",
        client_id     = CLIENT_ID,
        client_secret = CLIENT_SECRET,
        scopes        = SCOPES,
    )

    # Auto-refresh if expired
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(GoogleRequest())
            sb.table("youtube_connections").update({
                "access_token": creds.token,
                "expires_at":   (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            }).eq("user_id", user_id).execute()
        except Exception as e:
            raise HTTPException(401, f"Token expired and refresh failed: {str(e)}. Please reconnect YouTube.")

    return creds


# ─────────────────────────────────────────────────────────────────────────────
# 1. OAUTH START
# Frontend: window.location.href = API + '/api/youtube/auth?user_id=' + userId
# ─────────────────────────────────────────────────────────────────────────────
# Store code verifiers per user_id
_CODE_VERIFIERS: dict = {}

@router.get("/auth")
async def youtube_auth(user_id: str):
    """Redirect user to Google OAuth with PKCE (S256)."""
    import secrets, hashlib, base64
    from urllib.parse import urlencode

    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(500, "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set.")

    # Generate PKCE code_verifier (43-128 chars, URL-safe)
    code_verifier  = base64.urlsafe_b64encode(secrets.token_bytes(96)).rstrip(b"=").decode()

    # Generate code_challenge = BASE64URL(SHA256(code_verifier))
    digest         = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()

    # Store verifier — needed in callback
    _CODE_VERIFIERS[user_id] = code_verifier
    print(f"[YT Auth] PKCE generated. verifier={code_verifier[:10]}... user={user_id[:8]}...")

    params = {
        "client_id":             CLIENT_ID,
        "redirect_uri":          REDIRECT_URI,
        "response_type":         "code",
        "scope":                 " ".join(SCOPES),
        "access_type":           "offline",
        "prompt":                "consent",
        "state":                 user_id,
        "code_challenge":        code_challenge,
        "code_challenge_method": "S256",
    }
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    print(f"[YT Auth] Redirecting to Google...")
    return RedirectResponse(auth_url)


# ─────────────────────────────────────────────────────────────────────────────
# 2. OAUTH CALLBACK
# Google redirects here after user grants permission
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/callback")
async def youtube_callback(request: Request, sb=Depends(get_sb)):
    """Handle Google OAuth callback — save tokens to Supabase."""
    # MUST set before flow operations
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    params  = dict(request.query_params)
    code    = params.get("code")
    user_id = params.get("state")
    error   = params.get("error")

    if error:
        return RedirectResponse(f"{FRONTEND_URL}/youtube?error={error}")
    if not code or not user_id:
        return RedirectResponse(f"{FRONTEND_URL}/youtube?error=missing_params")

    # Fetch token using PKCE code_verifier
    try:
        import httpx as _httpx

        # Get stored PKCE verifier
        code_verifier = _CODE_VERIFIERS.pop(user_id, None)
        print(f"[YT Callback] code_verifier found: {code_verifier is not None}")

        post_data = {
            "code":          code,
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri":  REDIRECT_URI,
            "grant_type":    "authorization_code",
        }
        if code_verifier:
            post_data["code_verifier"] = code_verifier

        async with _httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data=post_data,
                timeout=30,
            )
        token_data = token_resp.json()
        print(f"[YT Callback] Token response keys: {list(token_data.keys())}")

        if "error" in token_data:
            print(f"[YT Callback] Token FAILED: {token_data}")
            return RedirectResponse(f"{FRONTEND_URL}/youtube?error={token_data.get('error_description', token_data.get('error'))}")

        access_token  = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")

        from google.oauth2.credentials import Credentials
        creds = Credentials(
            token         = access_token,
            refresh_token = refresh_token,
            token_uri     = "https://oauth2.googleapis.com/token",
            client_id     = CLIENT_ID,
            client_secret = CLIENT_SECRET,
            scopes        = SCOPES,
        )
        print(f"[YT Callback] Token OK: {access_token[:20] if access_token else None}")
    except Exception as e:
        print(f"[YT Callback] Token fetch FAILED: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/youtube?error=token_fetch_failed")

    # Get channel info
    ch_id = ch_name = ch_img = subs = ""
    try:
        yt      = build("youtube", "v3", credentials=creds)
        ch_r    = yt.channels().list(part="snippet,statistics", mine=True).execute()
        ch      = ch_r["items"][0]
        ch_id   = ch["id"]
        ch_name = ch["snippet"]["title"]
        ch_img  = ch["snippet"]["thumbnails"]["default"]["url"]
        subs    = ch["statistics"].get("subscriberCount", "0")
        print(f"[YT Callback] Channel: {ch_name}, subs={subs}")
    except Exception as e:
        print(f"[YT Callback] Channel fetch failed (continuing): {e}")

    # Save to Supabase
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    try:
        result = sb.table("youtube_connections").upsert({
            "user_id":       user_id,
            "access_token":  creds.token,
            "refresh_token": creds.refresh_token,
            "expires_at":    expires_at,
            "channel_id":    ch_id,
            "channel_name":  ch_name,
            "channel_thumb": ch_img,
            "subscribers":   subs,
            "connected_at":  datetime.now(timezone.utc).isoformat(),
        }, on_conflict="user_id").execute()
        print(f"[YT Callback] Supabase upsert OK: {result.data}")
    except Exception as e:
        print(f"[YT Callback] Supabase upsert FAILED: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/youtube?error=db_save_failed&detail={str(e)[:100]}")

    print(f"[YT Callback] All done — redirecting to frontend")
    return RedirectResponse(f"{FRONTEND_URL}/youtube?connected=true")


# ─────────────────────────────────────────────────────────────────────────────
# 3. STATUS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/status/{user_id}")
async def youtube_status(user_id: str, sb=Depends(get_sb)):
    """Check connection status and return channel info."""
    try:
        r = sb.table("youtube_connections") \
            .select("channel_id,channel_name,channel_thumb,subscribers,expires_at") \
            .eq("user_id", user_id) \
            .maybe_single().execute()
    except Exception:
        r = None

    if not r or not r.data:
        return {"connected": False}

    data    = r.data
    expired = False
    if data.get("expires_at"):
        exp     = datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00"))
        expired = exp < datetime.now(timezone.utc)

    return {
        "connected":    True,
        "expired":      expired,
        "channel_id":   data.get("channel_id"),
        "channel_name": data.get("channel_name"),
        "channel_thumb":data.get("channel_thumb"),
        "subscribers":  data.get("subscribers", "0"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. DISCONNECT
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/disconnect/{user_id}")
async def youtube_disconnect(user_id: str, sb=Depends(get_sb)):
    sb.table("youtube_connections").delete().eq("user_id", user_id).execute()
    return {"success": True, "message": "YouTube disconnected."}


# ─────────────────────────────────────────────────────────────────────────────
# 5. ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/analytics/{user_id}")
async def get_analytics(user_id: str, sb=Depends(get_sb)):
    """Channel stats + recent videos performance."""
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    # Channel info
    ch_r = yt.channels().list(
        part="snippet,statistics",
        mine=True
    ).execute()

    if not ch_r.get("items"):
        raise HTTPException(404, "No YouTube channel found.")

    ch    = ch_r["items"][0]
    stats = ch.get("statistics", {})

    # Recent videos
    search_r = yt.search().list(
        part="snippet",
        forMine=True,
        type="video",
        order="date",
        maxResults=12
    ).execute()

    video_ids = [i["id"]["videoId"] for i in search_r.get("items", [])]
    videos    = []

    if video_ids:
        vid_r = yt.videos().list(
            part="snippet,statistics,status",
            id=",".join(video_ids)
        ).execute()

        for v in vid_r.get("items", []):
            vs = v.get("statistics", {})
            videos.append({
                "id":           v["id"],
                "title":        v["snippet"]["title"],
                "thumbnail":    v["snippet"]["thumbnails"].get("medium", {}).get("url", ""),
                "published_at": v["snippet"]["publishedAt"],
                "status":       v["status"]["privacyStatus"],
                "views":        int(vs.get("viewCount", 0)),
                "likes":        int(vs.get("likeCount", 0)),
                "comments":     int(vs.get("commentCount", 0)),
                "url":          f"https://youtube.com/watch?v={v['id']}",
            })

    return {
        "channel": {
            "id":          ch["id"],
            "name":        ch["snippet"]["title"],
            "description": ch["snippet"].get("description", ""),
            "thumbnail":   ch["snippet"]["thumbnails"]["default"]["url"],
            "subscribers": int(stats.get("subscriberCount", 0)),
            "total_views": int(stats.get("viewCount", 0)),
            "video_count": int(stats.get("videoCount", 0)),
            "country":     ch["snippet"].get("country", ""),
        },
        "recent_videos": videos,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. VIDEO LIST
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/videos/{user_id}")
async def get_videos(user_id: str, max_results: int = 20, sb=Depends(get_sb)):
    """List all uploaded videos with stats."""
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    # Get uploads playlist ID
    ch_r     = yt.channels().list(part="contentDetails", mine=True).execute()
    playlist = ch_r["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    # Get videos from playlist
    pl_r = yt.playlistItems().list(
        part="snippet",
        playlistId=playlist,
        maxResults=max_results
    ).execute()

    video_ids = [i["snippet"]["resourceId"]["videoId"] for i in pl_r.get("items", [])]

    if not video_ids:
        return {"videos": [], "total": 0}

    vid_r = yt.videos().list(
        part="snippet,statistics,status,contentDetails",
        id=",".join(video_ids)
    ).execute()

    videos = []
    for v in vid_r.get("items", []):
        vs = v.get("statistics", {})
        videos.append({
            "id":           v["id"],
            "title":        v["snippet"]["title"],
            "description":  v["snippet"].get("description", "")[:200],
            "thumbnail":    v["snippet"]["thumbnails"].get("medium", {}).get("url", ""),
            "published_at": v["snippet"]["publishedAt"],
            "status":       v["status"]["privacyStatus"],
            "duration":     v["contentDetails"].get("duration", ""),
            "views":        int(vs.get("viewCount", 0)),
            "likes":        int(vs.get("likeCount", 0)),
            "comments":     int(vs.get("commentCount", 0)),
            "url":          f"https://youtube.com/watch?v={v['id']}",
        })

    return {"videos": videos, "total": len(videos)}


# ─────────────────────────────────────────────────────────────────────────────
# 7. VIDEO UPLOAD
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload-video")
async def upload_video(
    user_id:      str        = Form(...),
    title:        str        = Form(...),
    description:  str        = Form(""),
    tags:         str        = Form(""),
    privacy:      str        = Form("private"),
    scheduled_at: str        = Form(""),
    file:         UploadFile = File(...),
    sb = Depends(get_sb)
):
    """
    Upload video to YouTube.
    privacy: public | private | unlisted | scheduled
    scheduled_at: ISO datetime string (only for scheduled)
    """
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    tags_list = [t.strip() for t in tags.split(",") if t.strip()]

    # Write to temp file
    suffix = ".mp4"
    if file.filename:
        ext = os.path.splitext(file.filename)[1]
        if ext: suffix = ext

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content  = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    # Build request body
    actual_privacy = "private" if privacy == "scheduled" else privacy
    body = {
        "snippet": {
            "title":       title[:100],
            "description": description[:5000],
            "tags":        tags_list,
            "categoryId":  "22",
        },
        "status": {
            "privacyStatus":           actual_privacy,
            "selfDeclaredMadeForKids": False,
        }
    }

    if privacy == "scheduled" and scheduled_at:
        body["status"]["publishAt"] = scheduled_at

    media = MediaFileUpload(tmp_path, chunksize=-1, resumable=True)

    try:
        request  = yt.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media,
        )
        response = None
        while response is None:
            _, response = request.next_chunk()

        video_id = response["id"]
        os.unlink(tmp_path)

        # Log to Supabase
        try:
            sb.table("scheduled_posts").insert({
                "user_id":      user_id,
                "title":        title,
                "content":      description,
                "platform":     "youtube",
                "scheduled_at": scheduled_at or datetime.now(timezone.utc).isoformat(),
                "status":       "published" if privacy == "public" else privacy,
            }).execute()
        except Exception:
            pass

        return {
            "success":  True,
            "video_id": video_id,
            "url":      f"https://youtube.com/watch?v={video_id}",
            "status":   privacy,
            "message":  "Video uploaded successfully!"
        }

    except Exception as e:
        try: os.unlink(tmp_path)
        except Exception: pass
        raise HTTPException(500, f"Upload failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# 8. COMMUNITY POST
# ─────────────────────────────────────────────────────────────────────────────
class CommunityPostRequest(BaseModel):
    user_id:   str
    text:      str
    image_url: Optional[str] = None

@router.post("/community-post")
async def community_post(body: CommunityPostRequest, sb=Depends(get_sb)):
    """
    Post to YouTube Community tab.
    Text-only or Text + Image.
    Note: Requires 500+ subscribers.
    """
    import httpx
    creds = get_credentials(body.user_id, sb)

    headers = {
        "Authorization": f"Bearer {creds.token}",
        "Content-Type":  "application/json",
    }

    payload = {
        "snippet": {
            "text": body.text,
        }
    }
    if body.image_url:
        payload["snippet"]["backgroundImageUrl"] = body.image_url

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            "https://www.googleapis.com/youtube/v3/communityPosts",
            headers=headers,
            params={"part": "snippet"},
            json=payload,
        )
        d = r.json()

    if "error" in d:
        raise HTTPException(400,
            f"Community post error: {d['error']['message']}. "
            "Community posts require 500+ subscribers."
        )

    return {
        "success": True,
        "post_id": d.get("id"),
        "message": "Community post published!"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 9. COMMENTS (INBOX)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/comments/{user_id}")
async def get_comments(user_id: str, max_results: int = 30, sb=Depends(get_sb)):
    """Recent comments across all channel videos."""
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    threads_r = yt.commentThreads().list(
        part="snippet,replies",
        allThreadsRelatedToChannelId=True,
        maxResults=max_results,
        order="time"
    ).execute()

    comments = []
    for thread in threads_r.get("items", []):
        top = thread["snippet"]["topLevelComment"]["snippet"]
        comments.append({
            "id":          thread["id"],
            "video_id":    thread["snippet"]["videoId"],
            "author":      top["authorDisplayName"],
            "author_pic":  top.get("authorProfileImageUrl", ""),
            "text":        top["textDisplay"],
            "likes":       top.get("likeCount", 0),
            "published_at":top["publishedAt"],
            "reply_count": thread["snippet"]["totalReplyCount"],
            "replies": [
                {
                    "author":       r["snippet"]["authorDisplayName"],
                    "text":         r["snippet"]["textDisplay"],
                    "published_at": r["snippet"]["publishedAt"],
                }
                for r in thread.get("replies", {}).get("comments", [])
            ]
        })

    return {"total": len(comments), "comments": comments}


# ─────────────────────────────────────────────────────────────────────────────
# 10. REPLY TO COMMENT
# ─────────────────────────────────────────────────────────────────────────────
class ReplyRequest(BaseModel):
    user_id:    str
    comment_id: str
    text:       str

@router.post("/reply-comment")
async def reply_comment(body: ReplyRequest, sb=Depends(get_sb)):
    """Reply to a YouTube comment."""
    creds = get_credentials(body.user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    r = yt.comments().insert(
        part="snippet",
        body={
            "snippet": {
                "parentId":     body.comment_id,
                "textOriginal": body.text,
            }
        }
    ).execute()

    return {"success": True, "reply_id": r["id"]}


# ─────────────────────────────────────────────────────────────────────────────
# 11. UPDATE VIDEO
# ─────────────────────────────────────────────────────────────────────────────
class UpdateVideoRequest(BaseModel):
    user_id:     str
    video_id:    str
    title:       Optional[str] = None
    description: Optional[str] = None
    privacy:     Optional[str] = None

@router.put("/update-video")
async def update_video(body: UpdateVideoRequest, sb=Depends(get_sb)):
    """Update video title, description, or privacy status."""
    creds = get_credentials(body.user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    current = yt.videos().list(
        part="snippet,status",
        id=body.video_id
    ).execute()

    if not current.get("items"):
        raise HTTPException(404, "Video not found.")

    snippet = current["items"][0]["snippet"]
    status  = current["items"][0]["status"]

    if body.title:       snippet["title"]       = body.title
    if body.description: snippet["description"] = body.description
    if body.privacy:     status["privacyStatus"] = body.privacy

    yt.videos().update(
        part="snippet,status",
        body={"id": body.video_id, "snippet": snippet, "status": status}
    ).execute()

    return {"success": True, "message": "Video updated!"}
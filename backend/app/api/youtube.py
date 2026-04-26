# backend/app/api/youtube.py
# Complete YouTube Integration for Nexora OS
# Fixes: Community post, timezone (browser local time), privacy update
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
from typing import Optional, List
from supabase import create_client

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import google_auth_oauthlib.flow
import httpx

router = APIRouter(prefix="/api/youtube", tags=["YouTube"])

# ── Config ────────────────────────────────────────────────────────────────────
APP_ENV      = os.environ.get("APP_ENV", "production")
IS_LOCAL     = APP_ENV == "local"
CLIENT_ID    = os.environ.get("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET= os.environ.get("GOOGLE_CLIENT_SECRET", "")

LOCAL_REDIRECT   = "http://localhost:8000/api/youtube/callback"
PROD_REDIRECT    = "https://creator-os-production-0bf8.up.railway.app/api/youtube/callback"
REDIRECT_URI     = LOCAL_REDIRECT if IS_LOCAL else PROD_REDIRECT

LOCAL_FRONTEND   = "http://localhost:5173"
PROD_FRONTEND    = "https://creator-os-ochre.vercel.app"
FRONTEND_URL     = LOCAL_FRONTEND if IS_LOCAL else PROD_FRONTEND

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube.readonly",
]

# PKCE store
_CODE_VERIFIERS: dict = {}

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

# ── Get credentials ───────────────────────────────────────────────────────────
def get_credentials(user_id: str, sb) -> Credentials:
    try:
        r = sb.table("youtube_connections") \
            .select("*") \
            .eq("user_id", user_id) \
            .maybe_single().execute()
    except Exception:
        r = None

    if not r or not r.data:
        raise HTTPException(401, "YouTube not connected. Go to Settings → Social Accounts → Connect YouTube.")

    data  = r.data
    creds = Credentials(
        token         = data["access_token"],
        refresh_token = data.get("refresh_token"),
        token_uri     = "https://oauth2.googleapis.com/token",
        client_id     = CLIENT_ID,
        client_secret = CLIENT_SECRET,
        scopes        = SCOPES,
    )

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(GoogleRequest())
            sb.table("youtube_connections").update({
                "access_token": creds.token,
                "expires_at":   (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            }).eq("user_id", user_id).execute()
        except Exception as e:
            raise HTTPException(401, f"Token expired. Please reconnect YouTube in Settings. ({str(e)[:60]})")

    return creds


# ─────────────────────────────────────────────────────────────────────────────
# 1. OAUTH START — with PKCE
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/auth")
async def youtube_auth(user_id: str):
    import secrets, hashlib, base64
    from urllib.parse import urlencode

    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(500, "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set.")

    # Generate PKCE
    code_verifier  = base64.urlsafe_b64encode(secrets.token_bytes(96)).rstrip(b"=").decode()
    digest         = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    _CODE_VERIFIERS[user_id] = code_verifier

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
    print(f"[YT Auth] PKCE generated for user={user_id[:8]}...")
    return RedirectResponse(auth_url)


# ─────────────────────────────────────────────────────────────────────────────
# 2. OAUTH CALLBACK
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/callback")
async def youtube_callback(request: Request, sb=Depends(get_sb)):
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    params  = dict(request.query_params)
    code    = params.get("code")
    user_id = params.get("state")
    error   = params.get("error")

    if error:
        return RedirectResponse(f"{FRONTEND_URL}/youtube?error={error}")
    if not code or not user_id:
        return RedirectResponse(f"{FRONTEND_URL}/youtube?error=missing_params")

    # Exchange code for token using PKCE verifier
    try:
        code_verifier = _CODE_VERIFIERS.pop(user_id, None)
        print(f"[YT Callback] verifier found: {code_verifier is not None}")

        post_data = {
            "code":          code,
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri":  REDIRECT_URI,
            "grant_type":    "authorization_code",
        }
        if code_verifier:
            post_data["code_verifier"] = code_verifier

        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data=post_data,
                timeout=30,
            )
        token_data = token_resp.json()
        print(f"[YT Callback] Token keys: {list(token_data.keys())}")

        if "error" in token_data:
            print(f"[YT Callback] Token FAILED: {token_data}")
            return RedirectResponse(f"{FRONTEND_URL}/youtube?error={token_data.get('error_description', token_data.get('error'))}")

        access_token  = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")

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
        yt   = build("youtube", "v3", credentials=creds)
        ch_r = yt.channels().list(part="snippet,statistics", mine=True).execute()
        ch   = ch_r["items"][0]
        ch_id   = ch["id"]
        ch_name = ch["snippet"]["title"]
        ch_img  = ch["snippet"]["thumbnails"]["default"]["url"]
        subs    = ch["statistics"].get("subscriberCount", "0")
        print(f"[YT Callback] Channel: {ch_name}, subs={subs}")
    except Exception as e:
        print(f"[YT Callback] Channel fetch failed: {e}")

    # Save to Supabase
    try:
        result = sb.table("youtube_connections").upsert({
            "user_id":       user_id,
            "access_token":  creds.token,
            "refresh_token": creds.refresh_token,
            "expires_at":    (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "channel_id":    ch_id,
            "channel_name":  ch_name,
            "channel_thumb": ch_img,
            "subscribers":   subs,
            "connected_at":  datetime.now(timezone.utc).isoformat(),
        }, on_conflict="user_id").execute()
        print(f"[YT Callback] Supabase OK: {result.data}")
    except Exception as e:
        print(f"[YT Callback] Supabase FAILED: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/youtube?error=db_save_failed")

    print(f"[YT Callback] Done — redirecting to frontend")
    return RedirectResponse(f"{FRONTEND_URL}/youtube?connected=true")


# ─────────────────────────────────────────────────────────────────────────────
# 3. STATUS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/status/{user_id}")
async def youtube_status(user_id: str, sb=Depends(get_sb)):
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
        try:
            exp     = datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00"))
            expired = exp < datetime.now(timezone.utc)
        except Exception:
            pass

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
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    ch_r = yt.channels().list(part="snippet,statistics", mine=True).execute()
    if not ch_r.get("items"):
        raise HTTPException(404, "No YouTube channel found.")
    ch    = ch_r["items"][0]
    stats = ch.get("statistics", {})

    search_r  = yt.search().list(part="snippet", forMine=True, type="video", order="date", maxResults=12).execute()
    video_ids = [i["id"]["videoId"] for i in search_r.get("items", [])]
    videos    = []

    if video_ids:
        vid_r = yt.videos().list(part="snippet,statistics,status", id=",".join(video_ids)).execute()
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
    creds    = get_credentials(user_id, sb)
    yt       = build("youtube", "v3", credentials=creds)
    ch_r     = yt.channels().list(part="contentDetails", mine=True).execute()
    playlist = ch_r["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
    pl_r     = yt.playlistItems().list(part="snippet", playlistId=playlist, maxResults=max_results).execute()
    video_ids= [i["snippet"]["resourceId"]["videoId"] for i in pl_r.get("items", [])]

    if not video_ids:
        return {"videos": [], "total": 0}

    vid_r = yt.videos().list(part="snippet,statistics,status,contentDetails", id=",".join(video_ids)).execute()
    videos = []
    for v in vid_r.get("items", []):
        vs = v.get("statistics", {})
        videos.append({
            "id":           v["id"],
            "title":        v["snippet"]["title"],
            "description":  v["snippet"].get("description", "")[:300],
            "thumbnail":    v["snippet"]["thumbnails"].get("medium", {}).get("url", ""),
            "published_at": v["snippet"]["publishedAt"],
            "status":       v["status"]["privacyStatus"],
            "duration":     v["contentDetails"].get("duration", ""),
            "views":        int(vs.get("viewCount", 0)),
            "likes":        int(vs.get("likeCount", 0)),
            "comments":     int(vs.get("commentCount", 0)),
            "url":          f"https://youtube.com/watch?v={v['id']}",
            "tags":         v["snippet"].get("tags", []),
            "category_id":  v["snippet"].get("categoryId", ""),
        })

    return {"videos": videos, "total": len(videos)}


# ─────────────────────────────────────────────────────────────────────────────
# 7. VIDEO UPLOAD — timezone fix
# Frontend sends local datetime string → we convert to UTC ISO for YouTube
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload-video")
async def upload_video(
    user_id:         str        = Form(...),
    title:           str        = Form(...),
    description:     str        = Form(""),
    tags:            str        = Form(""),
    privacy:         str        = Form("private"),
    scheduled_at:    str        = Form(""),    # browser local ISO datetime
    timezone_offset: int        = Form(0),     # browser UTC offset in minutes (e.g. -300 for PKT)
    file:            UploadFile = File(...),
    sb = Depends(get_sb)
):
    """
    Upload video to YouTube.
    timezone_offset: browser's getTimezoneOffset() value in minutes.
    PKT (UTC+5) = -300 (negative because getTimezoneOffset returns negative for ahead zones)
    We convert local time → UTC for YouTube's publishAt field.
    """
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    tags_list = [t.strip() for t in tags.split(",") if t.strip()]

    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        # Chunked read for large videos
        chunk_size = 4 * 1024 * 1024  # 4MB chunks
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            tmp.write(chunk)
    print(f"[YT Upload] Saved to {tmp_path}, size: {os.path.getsize(tmp_path)/1024/1024:.1f}MB")

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

    # Fix timezone: convert browser local time to UTC
    if privacy == "scheduled" and scheduled_at:
        try:
            # Parse the datetime-local input (e.g. "2026-04-20T23:52")
            naive_dt = datetime.fromisoformat(scheduled_at)
            # timezone_offset is browser's getTimezoneOffset() in minutes
            # PKT = UTC+5, so offset = -300 (browser returns negative for ahead zones)
            # To get UTC: add the offset (double negative = positive for PKT)
            utc_dt = naive_dt + timedelta(minutes=timezone_offset)
            # YouTube requires UTC ISO 8601
            publish_at = utc_dt.strftime("%Y-%m-%dT%H:%M:%S") + ".000Z"
            body["status"]["publishAt"] = publish_at
            print(f"[YT Upload] Schedule: local={scheduled_at}, offset={timezone_offset}min, UTC={publish_at}")
        except Exception as e:
            print(f"[YT Upload] Timezone conversion failed: {e} — using raw value")
            body["status"]["publishAt"] = scheduled_at

    chunk_mb = 50  # 50MB chunks for resumable upload
    media = MediaFileUpload(tmp_path, chunksize=chunk_mb * 1024 * 1024, resumable=True)

    try:
        request  = yt.videos().insert(part="snippet,status", body=body, media_body=media)
        response = None
        attempt  = 0
        while response is None:
            attempt += 1
            status, response = request.next_chunk()
            if status:
                print(f"[YT Upload] Progress: {int(status.progress() * 100)}%")

        video_id = response["id"]
        os.unlink(tmp_path)

        try:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()
            sb.table("scheduled_posts").insert({
                "user_id":      user_id,
                "title":        title,
                "content":      description,
                "caption":      title,
                "platforms":    ["youtube"],
                "status":       "published",
                "privacy":      privacy,
                "scheduled_for": now,
                "published_at": now,
                "created_at":   now,
            }).execute()
        except Exception as db_err:
            print(f"[YT Upload] DB save error (non-critical): {db_err}")

        return {
            "success":  True,
            "video_id": video_id,
            "url":      f"https://youtube.com/watch?v={video_id}",
            "status":   privacy,
            "message":  "Video uploaded successfully!"
        }

    except Exception as e:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        raise HTTPException(500, f"Upload failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# 8. UPDATE VIDEO PRIVACY
# ─────────────────────────────────────────────────────────────────────────────
class UpdateVideoRequest(BaseModel):
    user_id:     str
    video_id:    str
    title:       Optional[str] = None
    description: Optional[str] = None
    privacy:     Optional[str] = None  # public | private | unlisted

@router.put("/update-video")
async def update_video(body: UpdateVideoRequest, sb=Depends(get_sb)):
    """Update video title, description, or privacy status."""
    creds = get_credentials(body.user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    current = yt.videos().list(part="snippet,status", id=body.video_id).execute()
    if not current.get("items"):
        raise HTTPException(404, "Video not found.")

    snippet = current["items"][0]["snippet"]
    status  = current["items"][0]["status"]

    if body.title:       snippet["title"]        = body.title
    if body.description: snippet["description"]  = body.description
    if body.privacy:     status["privacyStatus"] = body.privacy

    yt.videos().update(
        part="snippet,status",
        body={"id": body.video_id, "snippet": snippet, "status": status}
    ).execute()

    return {"success": True, "message": f"Video updated to {body.privacy or 'saved'}!"}


# ─────────────────────────────────────────────────────────────────────────────
# 9. COMMUNITY POST — Fixed with direct API call
# ─────────────────────────────────────────────────────────────────────────────
class CommunityPostRequest(BaseModel):
    user_id:   str
    text:      str
    image_url: Optional[str] = None

@router.post("/community-post")
async def community_post(body: CommunityPostRequest, sb=Depends(get_sb)):
    """
    Post to YouTube Community tab.
    Uses YouTube v3 API posts endpoint (newer endpoint).
    Requires channel with community posts enabled (500+ subs usually).
    """
    creds = get_credentials(body.user_id, sb)

    # Refresh if expired
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())

    headers = {
        "Authorization": f"Bearer {creds.token}",
        "Content-Type":  "application/json",
        "Accept":        "application/json",
    }

    # Try newer posts endpoint first
    payload = {
        "snippet": {
            "text": body.text,
        }
    }

    async with httpx.AsyncClient(timeout=30) as c:
        # Try v3 posts endpoint
        r = await c.post(
            "https://www.googleapis.com/youtube/v3/posts",
            headers=headers,
            params={"part": "snippet"},
            json=payload,
        )

        print(f"[Community Post] Status: {r.status_code}")
        print(f"[Community Post] Body: {r.text[:300]}")

        # Handle empty response
        if not r.text or r.text.strip() == "":
            raise HTTPException(503,
                "YouTube Community Posts API is not available. "
                "This feature requires: 1) 500+ subscribers, "
                "2) Community tab enabled on your channel. "
                "Please post directly from YouTube Studio for now."
            )

        try:
            d = r.json()
        except Exception:
            raise HTTPException(503,
                f"YouTube API returned unexpected response (status {r.status_code}). "
                "Community posts may not be enabled on your channel yet. "
                "Check: YouTube Studio → Monetization → Community tab."
            )

    if r.status_code == 404:
        raise HTTPException(404,
            "Community Posts endpoint not found. "
            "Your channel may not have Community tab enabled yet. "
            "Requirement: 500+ subscribers + channel approved for Community posts."
        )

    if r.status_code == 403:
        err_msg = d.get("error", {}).get("message", "Permission denied") if isinstance(d, dict) else "Permission denied"
        raise HTTPException(403,
            f"Community posts not allowed: {err_msg}. "
            "Requires 500+ subscribers and Community tab enabled."
        )

    if isinstance(d, dict) and "error" in d:
        raise HTTPException(400, f"YouTube error: {d['error']['message']}")

    return {
        "success": True,
        "post_id": d.get("id") if isinstance(d, dict) else None,
        "message": "Community post published! ✅"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 10. GET COMMENTS with video analytics
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/comments/{user_id}")
async def get_comments(user_id: str, video_id: Optional[str] = None, max_results: int = 30, sb=Depends(get_sb)):
    """
    Returns comments. If video_id provided, returns comments for that video.
    Otherwise fetches recent videos first then gets comments from each.
    """
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    try:
        if video_id:
            # Comments for specific video
            threads_r = yt.commentThreads().list(
                part="snippet,replies",
                videoId=video_id,
                maxResults=max_results,
                order="time"
            ).execute()

            comments = []
            for thread in threads_r.get("items", []):
                top = thread["snippet"]["topLevelComment"]["snippet"]
                replies_list = []
                for reply in thread.get("replies", {}).get("comments", []):
                    replies_list.append({
                        "id":           reply["id"],
                        "author":       reply["snippet"]["authorDisplayName"],
                        "author_pic":   reply["snippet"].get("authorProfileImageUrl", ""),
                        "text":         reply["snippet"]["textDisplay"],
                        "likes":        reply["snippet"].get("likeCount", 0),
                        "published_at": reply["snippet"]["publishedAt"],
                    })
                comments.append({
                    "id":           thread["id"],
                    "video_id":     thread["snippet"]["videoId"],
                    "author":       top["authorDisplayName"],
                    "author_pic":   top.get("authorProfileImageUrl", ""),
                    "text":         top["textDisplay"],
                    "likes":        top.get("likeCount", 0),
                    "published_at": top["publishedAt"],
                    "reply_count":  thread["snippet"]["totalReplyCount"],
                    "replies":      replies_list,
                    "can_reply":    True,
                })
            return {"total": len(comments), "comments": comments}

        else:
            # Fetch from uploads playlist then get comments per video
            try:
                ch_r     = yt.channels().list(part="contentDetails", mine=True).execute()
                playlist = ch_r["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
                pl_r     = yt.playlistItems().list(
                    part="snippet",
                    playlistId=playlist,
                    maxResults=50  # fetch last 50 uploaded videos
                ).execute()
                video_ids = [i["snippet"]["resourceId"]["videoId"] for i in pl_r.get("items", [])]
            except Exception as e:
                return {"total": 0, "comments": [], "error": f"Could not fetch videos: {str(e)}"}

            all_comments = []
            for vid_id in video_ids:  # go through ALL videos
                try:
                    # Paginate through all comment pages
                    next_page = None
                    while True:
                        kwargs = {
                            "part":       "snippet,replies",
                            "videoId":    vid_id,
                            "maxResults": 100,  # max per page
                            "order":      "time",
                            "textFormat": "plainText",
                        }
                        if next_page:
                            kwargs["pageToken"] = next_page

                        t_r = yt.commentThreads().list(**kwargs).execute()

                        for thread in t_r.get("items", []):
                            top = thread["snippet"]["topLevelComment"]["snippet"]
                            replies_list = []
                            for reply in thread.get("replies", {}).get("comments", []):
                                replies_list.append({
                                    "id":           reply["id"],
                                    "author":       reply["snippet"]["authorDisplayName"],
                                    "author_pic":   reply["snippet"].get("authorProfileImageUrl", ""),
                                    "text":         reply["snippet"]["textDisplay"],
                                    "likes":        reply["snippet"].get("likeCount", 0),
                                    "published_at": reply["snippet"]["publishedAt"],
                                })
                            all_comments.append({
                                "id":           thread["id"],
                                "video_id":     thread["snippet"]["videoId"],
                                "author":       top["authorDisplayName"],
                                "author_pic":   top.get("authorProfileImageUrl", ""),
                                "text":         top["textDisplay"],
                                "likes":        top.get("likeCount", 0),
                                "published_at": top["publishedAt"],
                                "reply_count":  thread["snippet"]["totalReplyCount"],
                                "replies":      replies_list,
                                "can_reply":    True,
                            })

                        next_page = t_r.get("nextPageToken")
                        if not next_page:
                            break  # no more pages for this video

                except Exception:
                    continue  # skip videos with comments disabled

            # Sort newest first
            all_comments.sort(key=lambda x: x.get("published_at", ""), reverse=True)
            return {"total": len(all_comments), "comments": all_comments}

    except Exception as e:
        raise HTTPException(500, f"Comments error: {str(e)[:200]}")




# ─────────────────────────────────────────────────────────────────────────────
# 11. GET SINGLE VIDEO DETAIL (for comment page analytics)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/video-detail/{user_id}/{video_id}")
async def get_video_detail(user_id: str, video_id: str, sb=Depends(get_sb)):
    """Returns full video details + stats for the comment/analytics view."""
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    r = yt.videos().list(
        part="snippet,statistics,status,contentDetails",
        id=video_id
    ).execute()

    if not r.get("items"):
        raise HTTPException(404, "Video not found.")

    v  = r["items"][0]
    vs = v.get("statistics", {})
    sn = v["snippet"]

    # Parse duration PT4M30S → 4:30
    dur_raw = v["contentDetails"].get("duration", "PT0S")
    try:
        import re
        m = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', dur_raw)
        h, mn, s = (int(m.group(i) or 0) for i in (1, 2, 3))
        duration = f"{h}:{mn:02d}:{s:02d}" if h else f"{mn}:{s:02d}"
    except Exception:
        duration = dur_raw

    return {
        "id":           video_id,
        "title":        sn["title"],
        "description":  sn.get("description", ""),
        "thumbnail":    sn["thumbnails"].get("maxres", sn["thumbnails"].get("high", {})).get("url", ""),
        "published_at": sn["publishedAt"],
        "status":       v["status"]["privacyStatus"],
        "duration":     duration,
        "url":          f"https://youtube.com/watch?v={video_id}",
        "tags":         sn.get("tags", []),
        "category_id":  sn.get("categoryId", ""),
        "stats": {
            "views":    int(vs.get("viewCount", 0)),
            "likes":    int(vs.get("likeCount", 0)),
            "comments": int(vs.get("commentCount", 0)),
            "favorites":int(vs.get("favoriteCount", 0)),
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# 12. REPLY TO COMMENT
# ─────────────────────────────────────────────────────────────────────────────
class ReplyRequest(BaseModel):
    user_id:    str
    comment_id: str
    text:       str

@router.post("/reply-comment")
async def reply_comment(body: ReplyRequest, sb=Depends(get_sb)):
    creds = get_credentials(body.user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)
    r = yt.comments().insert(
        part="snippet",
        body={"snippet": {"parentId": body.comment_id, "textOriginal": body.text}}
    ).execute()
    return {"success": True, "reply_id": r["id"]}
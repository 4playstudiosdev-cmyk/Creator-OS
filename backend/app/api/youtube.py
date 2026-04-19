# backend/app/api/youtube.py
# Complete YouTube Integration for Nexora OS
# Features: OAuth, Video Upload, Community Post, Schedule, Analytics
#
# Add to main.py:
#   from app.api.youtube import router as youtube_router
#   app.include_router(youtube_router)
#
# Google Cloud Console — Add this Redirect URI:
#   https://creator-os-production-0bf8.up.railway.app/api/youtube/callback

import os
import json
import tempfile
import httpx
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import google_auth_oauthlib.flow

router = APIRouter(prefix="/api/youtube", tags=["YouTube"])

# ── Config ────────────────────────────────────────────────────────────────────
CLIENT_ID        = os.environ.get("GOOGLE_CLIENT_ID")
CLIENT_SECRET    = os.environ.get("GOOGLE_CLIENT_SECRET")
RAILWAY_URL      = "https://creator-os-production-0bf8.up.railway.app"
REDIRECT_URI     = f"{RAILWAY_URL}/api/youtube/callback"
FRONTEND_URL     = "https://creator-os-ochre.vercel.app"

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtubepartner",
]

# ── Supabase ──────────────────────────────────────────────────────────────────
def get_sb():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )

# ── Get YouTube credentials from Supabase ────────────────────────────────────
def get_credentials(user_id: str, sb) -> Credentials:
    """
    Fetch stored OAuth tokens from Supabase.
    Auto-refreshes if expired.
    Token saved for 7 days.
    """
    r = sb.table("youtube_connections") \
        .select("*") \
        .eq("user_id", user_id) \
        .maybe_single().execute()

    if not r.data:
        raise HTTPException(401, "YouTube not connected. Please connect from Settings.")

    data = r.data
    creds = Credentials(
        token         = data["access_token"],
        refresh_token = data["refresh_token"],
        token_uri     = "https://oauth2.googleapis.com/token",
        client_id     = CLIENT_ID,
        client_secret = CLIENT_SECRET,
        scopes        = SCOPES,
    )

    # Auto-refresh if expired
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
        # Save refreshed token back to Supabase
        sb.table("youtube_connections").update({
            "access_token": creds.token,
            "expires_at":   (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        }).eq("user_id", user_id).execute()

    return creds


# ─────────────────────────────────────────────────────────────────────────────
# 1. OAUTH — Start flow
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/auth")
async def youtube_auth(user_id: str):
    """
    Start YouTube OAuth flow.
    Frontend calls: /api/youtube/auth?user_id=UUID
    Redirects user to Google consent screen.
    """
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        {
            "web": {
                "client_id":                   CLIENT_ID,
                "client_secret":               CLIENT_SECRET,
                "auth_uri":                    "https://accounts.google.com/o/oauth2/auth",
                "token_uri":                   "https://oauth2.googleapis.com/token",
                "redirect_uris":               [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = REDIRECT_URI

    auth_url, _ = flow.authorization_url(
        access_type     = "offline",
        include_granted_scopes = "true",
        prompt          = "consent",
        state           = user_id,   # pass user_id through OAuth state
    )
    return RedirectResponse(auth_url)


# ─────────────────────────────────────────────────────────────────────────────
# 2. OAUTH — Callback (Google redirects here)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/callback")
async def youtube_callback(request: Request, sb=Depends(get_sb)):
    """
    Google redirects here after user grants permission.
    Saves tokens to Supabase youtube_connections table.
    Redirects back to frontend YouTube Studio page.
    """
    params  = dict(request.query_params)
    code    = params.get("code")
    user_id = params.get("state")
    error   = params.get("error")

    if error:
        return RedirectResponse(f"{FRONTEND_URL}/youtube?error={error}")

    if not code or not user_id:
        return RedirectResponse(f"{FRONTEND_URL}/youtube?error=missing_params")

    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        {
            "web": {
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
                "token_uri":     "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
        state=user_id,
    )
    flow.redirect_uri = REDIRECT_URI
    flow.fetch_token(code=code)

    creds = flow.credentials

    # Get channel info
    try:
        yt      = build("youtube", "v3", credentials=creds)
        channel = yt.channels().list(part="snippet,statistics", mine=True).execute()
        ch      = channel["items"][0]
        channel_id    = ch["id"]
        channel_name  = ch["snippet"]["title"]
        channel_thumb = ch["snippet"]["thumbnails"]["default"]["url"]
        subscribers   = ch["statistics"].get("subscriberCount", "0")
    except Exception:
        channel_id    = ""
        channel_name  = "YouTube Channel"
        channel_thumb = ""
        subscribers   = "0"

    # Save to Supabase — token valid for 7 days
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    sb.table("youtube_connections").upsert({
        "user_id":       user_id,
        "access_token":  creds.token,
        "refresh_token": creds.refresh_token,
        "expires_at":    expires_at,
        "channel_id":    channel_id,
        "channel_name":  channel_name,
        "channel_thumb": channel_thumb,
        "subscribers":   subscribers,
        "connected_at":  datetime.now(timezone.utc).isoformat(),
    }, on_conflict="user_id").execute()

    return RedirectResponse(f"{FRONTEND_URL}/youtube?connected=true")


# ─────────────────────────────────────────────────────────────────────────────
# 3. STATUS CHECK
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/status/{user_id}")
async def youtube_status(user_id: str, sb=Depends(get_sb)):
    """Check if YouTube is connected and return channel info."""
    r = sb.table("youtube_connections") \
        .select("channel_id, channel_name, channel_thumb, subscribers, expires_at") \
        .eq("user_id", user_id) \
        .maybe_single().execute()

    if not r.data:
        return {"connected": False}

    data       = r.data
    expires_at = data.get("expires_at")
    expired    = False

    if expires_at:
        exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
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
# 5. CHANNEL ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/analytics/{user_id}")
async def get_analytics(user_id: str, sb=Depends(get_sb)):
    """Returns channel stats + last 10 videos with performance data."""
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    # Channel stats
    ch_r = yt.channels().list(
        part="snippet,statistics,brandingSettings",
        mine=True
    ).execute()
    ch   = ch_r["items"][0]

    # Recent videos
    search_r = yt.search().list(
        part="snippet",
        forMine=True,
        type="video",
        order="date",
        maxResults=10
    ).execute()

    video_ids = [i["id"]["videoId"] for i in search_r.get("items", [])]

    videos = []
    if video_ids:
        vid_r = yt.videos().list(
            part="snippet,statistics,status",
            id=",".join(video_ids)
        ).execute()

        for v in vid_r.get("items", []):
            stats = v.get("statistics", {})
            videos.append({
                "id":           v["id"],
                "title":        v["snippet"]["title"],
                "thumbnail":    v["snippet"]["thumbnails"].get("medium", {}).get("url"),
                "published_at": v["snippet"]["publishedAt"],
                "status":       v["status"]["privacyStatus"],
                "views":        int(stats.get("viewCount", 0)),
                "likes":        int(stats.get("likeCount", 0)),
                "comments":     int(stats.get("commentCount", 0)),
            })

    stats = ch.get("statistics", {})
    return {
        "channel": {
            "id":           ch["id"],
            "name":         ch["snippet"]["title"],
            "description":  ch["snippet"]["description"],
            "thumbnail":    ch["snippet"]["thumbnails"]["default"]["url"],
            "subscribers":  int(stats.get("subscriberCount", 0)),
            "total_views":  int(stats.get("viewCount", 0)),
            "video_count":  int(stats.get("videoCount", 0)),
            "country":      ch["snippet"].get("country", ""),
        },
        "recent_videos": videos,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. VIDEO UPLOAD (Publish / Draft / Schedule)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload-video")
async def upload_video(
    user_id:      str        = Form(...),
    title:        str        = Form(...),
    description:  str        = Form(""),
    tags:         str        = Form(""),          # comma separated
    privacy:      str        = Form("private"),   # public | private | unlisted
    scheduled_at: str        = Form(""),          # ISO string for scheduled
    file:         UploadFile = File(...),
    sb = Depends(get_sb)
):
    """
    Upload video to YouTube.
    privacy options:
      - "public"    → publish immediately
      - "private"   → save as draft
      - "unlisted"  → unlisted
      - "scheduled" → pass scheduled_at ISO datetime
    """
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    # Save file temporarily
    suffix = ".mp4" if "mp4" in (file.filename or "") else ".mov"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    tags_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    # Build body
    body = {
        "snippet": {
            "title":       title[:100],
            "description": description[:5000],
            "tags":        tags_list,
            "categoryId":  "22",  # People & Blogs
        },
        "status": {
            "privacyStatus":         "private" if privacy == "scheduled" else privacy,
            "selfDeclaredMadeForKids": False,
        }
    }

    # Schedule
    if privacy == "scheduled" and scheduled_at:
        body["status"]["publishAt"] = scheduled_at

    media = MediaFileUpload(tmp_path, chunksize=-1, resumable=True)

    try:
        request = yt.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media,
        )
        response = None
        while response is None:
            _, response = request.next_chunk()

        video_id = response["id"]

        # Clean up temp file
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
            "success":   True,
            "video_id":  video_id,
            "url":       f"https://youtube.com/watch?v={video_id}",
            "status":    privacy,
            "message":   f"Video {'scheduled' if privacy == 'scheduled' else 'uploaded'} successfully!"
        }

    except Exception as e:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        raise HTTPException(500, f"Upload failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# 7. COMMUNITY POST (Text + optional Image)
# ─────────────────────────────────────────────────────────────────────────────
class CommunityPostRequest(BaseModel):
    user_id:   str
    text:      str
    image_url: Optional[str] = None  # public image URL (optional)

@router.post("/community-post")
async def community_post(body: CommunityPostRequest, sb=Depends(get_sb)):
    """
    Post to YouTube Community tab.
    Text only or Text + Image.
    Requires channel to be eligible (1000+ subscribers usually).
    """
    creds = get_credentials(body.user_id, sb)

    # YouTube community posts use the Activities endpoint
    async with httpx.AsyncClient(timeout=30) as c:
        payload = {
            "snippet": {
                "type": "bulletin",
                "bulletinDetails": {
                    "resourceId": {}
                }
            },
            "contentDetails": {
                "bulletin": {
                    "resourceId": {}
                }
            }
        }

        # Use YouTube Data API directly via httpx for community posts
        headers = {"Authorization": f"Bearer {creds.token}"}

        if body.image_url:
            # Post with image
            post_data = {
                "text":     body.text,
                "imageUrl": body.image_url,
            }
        else:
            post_data = {"text": body.text}

        # Community posts via YouTube API v3
        r = await c.post(
            "https://www.googleapis.com/youtube/v3/communityPosts",
            headers=headers,
            params={"part": "snippet"},
            json={
                "snippet": {
                    "text": body.text,
                    **({"backgroundImageUrl": body.image_url} if body.image_url else {})
                }
            }
        )
        d = r.json()

    if "error" in d:
        # Fallback: some channels use activities endpoint
        raise HTTPException(400,
            f"Community post error: {d['error']['message']}. "
            "Note: Community posts require 500+ subscribers."
        )

    return {
        "success": True,
        "post_id": d.get("id"),
        "message": "Community post published!"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 8. GET VIDEOS LIST (for YouTube Studio page)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/videos/{user_id}")
async def get_videos(user_id: str, max_results: int = 20, sb=Depends(get_sb)):
    """Returns list of user's uploaded videos with stats."""
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    # Get uploads playlist
    ch_r = yt.channels().list(part="contentDetails", mine=True).execute()
    uploads_playlist = ch_r["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    # Get videos from playlist
    pl_r = yt.playlistItems().list(
        part="snippet",
        playlistId=uploads_playlist,
        maxResults=max_results
    ).execute()

    video_ids = [i["snippet"]["resourceId"]["videoId"] for i in pl_r.get("items", [])]

    if not video_ids:
        return {"videos": []}

    vid_r = yt.videos().list(
        part="snippet,statistics,status,contentDetails",
        id=",".join(video_ids)
    ).execute()

    videos = []
    for v in vid_r.get("items", []):
        stats = v.get("statistics", {})
        videos.append({
            "id":           v["id"],
            "title":        v["snippet"]["title"],
            "description":  v["snippet"]["description"][:200],
            "thumbnail":    v["snippet"]["thumbnails"].get("medium", {}).get("url", ""),
            "published_at": v["snippet"]["publishedAt"],
            "status":       v["status"]["privacyStatus"],
            "duration":     v["contentDetails"].get("duration", ""),
            "views":        int(stats.get("viewCount", 0)),
            "likes":        int(stats.get("likeCount", 0)),
            "comments":     int(stats.get("commentCount", 0)),
            "url":          f"https://youtube.com/watch?v={v['id']}",
        })

    return {"videos": videos, "total": len(videos)}


# ─────────────────────────────────────────────────────────────────────────────
# 9. GET COMMENTS (Inbox)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/comments/{user_id}")
async def get_comments(user_id: str, max_results: int = 30, sb=Depends(get_sb)):
    """Returns recent comments across all videos."""
    creds = get_credentials(user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    threads_r = yt.commentThreads().list(
        part="snippet,replies",
        allThreadsRelatedToChannelId=True,  # gets comments for MY channel
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
                    "author": r["snippet"]["authorDisplayName"],
                    "text":   r["snippet"]["textDisplay"],
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
                "parentId":   body.comment_id,
                "textOriginal": body.text,
            }
        }
    ).execute()

    return {"success": True, "reply_id": r["id"]}


# ─────────────────────────────────────────────────────────────────────────────
# 11. UPDATE VIDEO (title, description, privacy)
# ─────────────────────────────────────────────────────────────────────────────
class UpdateVideoRequest(BaseModel):
    user_id:     str
    video_id:    str
    title:       Optional[str] = None
    description: Optional[str] = None
    privacy:     Optional[str] = None  # public | private | unlisted

@router.put("/update-video")
async def update_video(body: UpdateVideoRequest, sb=Depends(get_sb)):
    """Update video title, description, or privacy."""
    creds = get_credentials(body.user_id, sb)
    yt    = build("youtube", "v3", credentials=creds)

    # Get current video data first
    current = yt.videos().list(
        part="snippet,status",
        id=body.video_id
    ).execute()

    if not current["items"]:
        raise HTTPException(404, "Video not found.")

    snippet = current["items"][0]["snippet"]
    status  = current["items"][0]["status"]

    if body.title:
        snippet["title"] = body.title
    if body.description is not None:
        snippet["description"] = body.description
    if body.privacy:
        status["privacyStatus"] = body.privacy

    yt.videos().update(
        part="snippet,status",
        body={
            "id":      body.video_id,
            "snippet": snippet,
            "status":  status,
        }
    ).execute()

    return {"success": True, "message": "Video updated successfully!"}
from fastapi import APIRouter, HTTPException, Request, Header
import os
import httpx
import secrets
import tweepy
from urllib.parse import urlencode

router = APIRouter()

TWITTER_CLIENT_ID          = os.getenv("TWITTER_CLIENT_ID")
TWITTER_CLIENT_SECRET      = os.getenv("TWITTER_CLIENT_SECRET")
TWITTER_API_KEY            = os.getenv("TWITTER_API_KEY")
TWITTER_API_SECRET         = os.getenv("TWITTER_API_SECRET")
TWITTER_ACCESS_TOKEN       = os.getenv("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_TOKEN_SECRET = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
LINKEDIN_CLIENT_ID   = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")

FRONTEND_URL = "http://localhost:5173"


def _get_yt_service():
    """Get stored YouTube service from clipping module."""
    try:
        from app.api.clipping import get_youtube_service
        return get_youtube_service()
    except Exception:
        return None


def _get_yt_service_for_user(user_id: str):
    """Get per-user YouTube service from clipping module."""
    try:
        from app.api.clipping import get_youtube_service_for_user
        return get_youtube_service_for_user(user_id)
    except Exception:
        return None


def _get_supabase_user(token: str):
    from supabase import create_client
    sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    return sb.auth.get_user(token)


# ══════════════════════════════════════════════════════════════
# TWITTER
# ══════════════════════════════════════════════════════════════

@router.get("/twitter/auth")
async def twitter_auth():
    params = {
        "response_type":        "code",
        "client_id":            TWITTER_CLIENT_ID,
        "redirect_uri":         f"{FRONTEND_URL}/auth/twitter/callback",
        "scope":                "tweet.read tweet.write users.read offline.access",
        "state":                secrets.token_urlsafe(16),
        "code_challenge":       "challenge",
        "code_challenge_method":"plain",
    }
    return {"url": "https://twitter.com/i/oauth2/authorize?" + urlencode(params)}


@router.post("/twitter/token")
async def twitter_token(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.twitter.com/2/oauth2/token",
            data={"grant_type": "authorization_code", "code": body.get("code"),
                  "redirect_uri": f"{FRONTEND_URL}/auth/twitter/callback", "code_verifier": "challenge"},
            auth=(TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=resp.text)
    return resp.json()


@router.post("/twitter/post")
async def twitter_post(request: Request):
    body = await request.json()
    try:
        client = tweepy.Client(
            consumer_key=TWITTER_API_KEY, consumer_secret=TWITTER_API_SECRET,
            access_token=TWITTER_ACCESS_TOKEN, access_token_secret=TWITTER_ACCESS_TOKEN_SECRET,
        )
        response = client.create_tweet(text=body.get("text"))
        return {"success": True, "tweet_id": response.data["id"]}
    except tweepy.TweepyException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/twitter/stats")
async def twitter_stats(access_token: str):
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            "https://api.twitter.com/2/users/me",
            params={"user.fields": "public_metrics"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=resp.text)
    data    = resp.json().get("data", {})
    metrics = data.get("public_metrics", {})
    return {"username": data.get("username"), "name": data.get("name"),
            "followers": metrics.get("followers_count", 0),
            "following": metrics.get("following_count", 0),
            "tweets": metrics.get("tweet_count", 0)}


# ══════════════════════════════════════════════════════════════
# GOOGLE / YOUTUBE
# ══════════════════════════════════════════════════════════════

@router.get("/google/auth")
async def google_auth():
    return {"redirect": "/api/clipping/connect-youtube",
            "message": "Use /api/clipping/connect-youtube for YouTube OAuth"}


@router.post("/google/token")
async def google_token(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={"grant_type": "authorization_code", "code": body.get("code"),
                  "redirect_uri": f"{FRONTEND_URL}/auth/google/callback",
                  "client_id": GOOGLE_CLIENT_ID, "client_secret": GOOGLE_CLIENT_SECRET},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=resp.text)
    return resp.json()


@router.get("/youtube/connected")
async def youtube_connected():
    return {"connected": _get_yt_service() is not None}


@router.get("/youtube/stats")
async def youtube_stats(authorization: str = Header(None)):
    """Get channel stats using stored OAuth service."""
    # Try per-user service first
    if authorization and authorization.startswith("Bearer "):
        try:
            token   = authorization.split(" ")[1]
            user    = _get_supabase_user(token)
            user_id = user.user.id
            yt      = _get_yt_service_for_user(user_id)
            if yt:
                resp  = yt.channels().list(part="statistics,snippet", mine=True).execute()
                items = resp.get("items", [])
                if items:
                    stats   = items[0].get("statistics", {})
                    snippet = items[0].get("snippet", {})
                    return {"channel_name": snippet.get("title"),
                            "subscribers": int(stats.get("subscriberCount", 0)),
                            "total_views": int(stats.get("viewCount", 0)),
                            "total_videos": int(stats.get("videoCount", 0))}
        except Exception:
            pass

    # Fallback: global service
    yt = _get_yt_service()
    if yt:
        resp  = yt.channels().list(part="statistics,snippet", mine=True).execute()
        items = resp.get("items", [])
        if items:
            stats   = items[0].get("statistics", {})
            snippet = items[0].get("snippet", {})
            return {"channel_name": snippet.get("title"),
                    "subscribers": int(stats.get("subscriberCount", 0)),
                    "total_views": int(stats.get("viewCount", 0)),
                    "total_videos": int(stats.get("videoCount", 0))}

    return {"error": "YouTube not connected"}


@router.get("/youtube/videos")
async def youtube_videos(authorization: str = Header(None)):
    """
    Fetch YouTube videos using stored OAuth service (googleapiclient).
    Uses Authorization header to identify user — NO access_token query param.
    """
    # Resolve which YouTube service to use
    yt = None

    if authorization and authorization.startswith("Bearer "):
        try:
            token   = authorization.split(" ")[1]
            user    = _get_supabase_user(token)
            user_id = user.user.id
            yt      = _get_yt_service_for_user(user_id)
        except Exception:
            pass

    if not yt:
        yt = _get_yt_service()

    if not yt:
        raise HTTPException(
            status_code=400,
            detail="YouTube not connected. Please connect YouTube in Settings first."
        )

    try:
        # Channel info
        channel_res = yt.channels().list(part="snippet,statistics", mine=True).execute()
        ch_items    = channel_res.get("items", [])
        if not ch_items:
            raise HTTPException(status_code=404, detail="No YouTube channel found")

        ch_snippet = ch_items[0].get("snippet", {})
        ch_stats   = ch_items[0].get("statistics", {})
        channel = {
            "name":         ch_snippet.get("title", ""),
            "thumbnail":    ch_snippet.get("thumbnails", {}).get("default", {}).get("url", ""),
            "subscribers":  int(ch_stats.get("subscriberCount", 0)),
            "total_views":  int(ch_stats.get("viewCount", 0)),
            "total_videos": int(ch_stats.get("videoCount", 0)),
        }

        # Search videos
        search_res = yt.search().list(
            part="snippet", forMine=True, type="video",
            maxResults=20, order="date"
        ).execute()

        video_ids = [item["id"]["videoId"] for item in search_res.get("items", [])
                     if item.get("id", {}).get("videoId")]

        videos = []
        if video_ids:
            stats_res = yt.videos().list(
                part="snippet,statistics", id=",".join(video_ids)
            ).execute()

            for item in stats_res.get("items", []):
                s  = item.get("snippet", {})
                st = item.get("statistics", {})
                videos.append({
                    "id":           item["id"],
                    "title":        s.get("title", ""),
                    "thumbnail":    s.get("thumbnails", {}).get("medium", {}).get("url", ""),
                    "published_at": s.get("publishedAt", ""),
                    "views":        int(st.get("viewCount", 0)),
                    "likes":        int(st.get("likeCount", 0)),
                    "comments":     int(st.get("commentCount", 0)),
                    "url":          f"https://www.youtube.com/watch?v={item['id']}",
                })

        videos.sort(key=lambda x: x["views"], reverse=True)
        return {"channel": channel, "videos": videos}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube API error: {str(e)}")


# ══════════════════════════════════════════════════════════════
# LINKEDIN
# ══════════════════════════════════════════════════════════════

@router.get("/linkedin/auth")
async def linkedin_auth():
    params = {
        "response_type": "code", "client_id": LINKEDIN_CLIENT_ID,
        "redirect_uri":  f"{FRONTEND_URL}/auth/linkedin/callback",
        "scope":         "openid profile email w_member_social",
        "state":         secrets.token_urlsafe(16),
    }
    return {"url": "https://www.linkedin.com/oauth/v2/authorization?" + urlencode(params)}


@router.post("/linkedin/token")
async def linkedin_token(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={"grant_type": "authorization_code", "code": body.get("code"),
                  "redirect_uri": f"{FRONTEND_URL}/auth/linkedin/callback",
                  "client_id": LINKEDIN_CLIENT_ID, "client_secret": LINKEDIN_CLIENT_SECRET},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=resp.text)
    return resp.json()


@router.post("/linkedin/post")
async def linkedin_post(request: Request):
    body      = await request.json()
    token     = body.get("access_token")
    text      = body.get("text")
    person_id = body.get("person_id")
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://api.linkedin.com/v2/ugcPosts",
            json={
                "author": f"urn:li:person:{person_id}",
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {"text": text},
                        "shareMediaCategory": "NONE",
                    }
                },
                "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
            },
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
    if resp.status_code not in [200, 201]:
        raise HTTPException(status_code=400, detail=resp.text)
    return resp.json()


@router.get("/linkedin/stats")
async def linkedin_stats(access_token: str):
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=resp.text)
    data = resp.json()
    return {"name": data.get("name"), "email": data.get("email"),
            "picture": data.get("picture"), "person_id": data.get("sub")}
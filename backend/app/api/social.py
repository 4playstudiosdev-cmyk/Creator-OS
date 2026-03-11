from fastapi import APIRouter, HTTPException, Request
import os
import httpx
import secrets
import tweepy
from urllib.parse import urlencode

router = APIRouter()

TWITTER_CLIENT_ID = os.getenv("TWITTER_CLIENT_ID")
TWITTER_CLIENT_SECRET = os.getenv("TWITTER_CLIENT_SECRET")
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_TOKEN_SECRET = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")

FRONTEND_URL = "http://localhost:5173"

# ── Shared YouTube service (set after OAuth, used by clipping too) ──────────
# Import from clipping module so both share the same instance
def get_yt_service():
    try:
        from app.api.clipping import get_youtube_service
        return get_youtube_service()
    except Exception:
        return None

# ============ TWITTER ============

@router.get("/twitter/auth")
async def twitter_auth():
    params = {
        "response_type": "code",
        "client_id": TWITTER_CLIENT_ID,
        "redirect_uri": f"{FRONTEND_URL}/auth/twitter/callback",
        "scope": "tweet.read tweet.write users.read offline.access",
        "state": secrets.token_urlsafe(16),
        "code_challenge": "challenge",
        "code_challenge_method": "plain",
    }
    url = "https://twitter.com/i/oauth2/authorize?" + urlencode(params)
    return {"url": url}

@router.post("/twitter/token")
async def twitter_token(request: Request):
    body = await request.json()
    code = body.get("code")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.twitter.com/2/oauth2/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": f"{FRONTEND_URL}/auth/twitter/callback",
                "code_verifier": "challenge",
            },
            auth=(TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=resp.text)
    return resp.json()

@router.post("/twitter/post")
async def twitter_post(request: Request):
    body = await request.json()
    text = body.get("text")
    try:
        client = tweepy.Client(
            consumer_key=TWITTER_API_KEY,
            consumer_secret=TWITTER_API_SECRET,
            access_token=TWITTER_ACCESS_TOKEN,
            access_token_secret=TWITTER_ACCESS_TOKEN_SECRET,
        )
        print(f"[Twitter] Posting: {text[:50]}")
        response = client.create_tweet(text=text)
        print(f"[Twitter] Success! Tweet ID: {response.data['id']}")
        return {"success": True, "tweet_id": response.data["id"]}
    except tweepy.TweepyException as e:
        print(f"[Twitter] Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[Twitter] General Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/twitter/stats")
async def twitter_stats(access_token: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            user_resp = await client.get(
                "https://api.twitter.com/2/users/me",
                params={"user.fields": "public_metrics"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail=user_resp.text)
        data = user_resp.json().get("data", {})
        metrics = data.get("public_metrics", {})
        return {
            "username": data.get("username"),
            "name": data.get("name"),
            "followers": metrics.get("followers_count", 0),
            "following": metrics.get("following_count", 0),
            "tweets": metrics.get("tweet_count", 0),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ GOOGLE / YOUTUBE ============
# YouTube connect is handled in clipping.py via /api/clipping/connect-youtube
# Settings page calls that endpoint — one connection, used everywhere

@router.get("/google/auth")
async def google_auth():
    """Redirect to clipping YouTube OAuth — single connection point"""
    # This just proxies to the clipping connect endpoint
    return {"redirect": "/api/clipping/connect-youtube",
            "message": "Use /api/clipping/connect-youtube for YouTube OAuth"}

@router.post("/google/token")
async def google_token(request: Request):
    body = await request.json()
    code = body.get("code")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  f"{FRONTEND_URL}/auth/google/callback",
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
            },
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=resp.text)
    return resp.json()

@router.get("/youtube/stats")
async def youtube_stats(access_token: str = None):
    """Get YouTube channel stats — uses stored service if no token provided"""
    try:
        # Try stored googleapiclient service first (from clipping OAuth)
        yt = get_yt_service()
        if yt:
            resp = yt.channels().list(part="statistics,snippet", mine=True).execute()
            items = resp.get("items", [])
            if items:
                stats   = items[0].get("statistics", {})
                snippet = items[0].get("snippet", {})
                return {
                    "channel_name": snippet.get("title"),
                    "subscribers":  stats.get("subscriberCount", 0),
                    "total_views":  stats.get("viewCount", 0),
                    "total_videos": stats.get("videoCount", 0),
                }

        # Fallback: use access_token from localStorage (old flow)
        if access_token:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    params={"part": "statistics,snippet", "mine": "true"},
                    headers={"Authorization": f"Bearer {access_token}"},
                )
            if resp.status_code != 200:
                return {"error": f"YouTube API error: {resp.status_code}"}
            items = resp.json().get("items", [])
            if not items:
                return {"error": "No channel found"}
            channel = items[0]
            stats   = channel.get("statistics", {})
            snippet = channel.get("snippet", {})
            return {
                "channel_name": snippet.get("title"),
                "subscribers":  stats.get("subscriberCount", 0),
                "total_views":  stats.get("viewCount", 0),
                "total_videos": stats.get("videoCount", 0),
            }

        return {"error": "YouTube not connected"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/youtube/connected")
async def youtube_connected():
    """Check if YouTube is connected via clipping OAuth"""
    yt = get_yt_service()
    return {"connected": yt is not None}

@router.get("/youtube/videos")
async def youtube_videos(access_token: str):
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            channel_resp = await client.get(
                "https://www.googleapis.com/youtube/v3/channels",
                params={"part": "snippet,statistics", "mine": "true"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if channel_resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Channel fetch failed")

            items = channel_resp.json().get("items", [])
            if not items:
                raise HTTPException(status_code=404, detail="No YouTube channel found")

            channel_id      = items[0]["id"]
            channel_stats   = items[0].get("statistics", {})
            channel_snippet = items[0].get("snippet", {})

            videos_resp = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={"part": "snippet", "channelId": channel_id,
                        "type": "video", "order": "date", "maxResults": 20},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if videos_resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Videos fetch failed")

            video_items = videos_resp.json().get("items", [])
            video_ids   = [v["id"]["videoId"] for v in video_items if "videoId" in v.get("id", {})]

            if not video_ids:
                return {
                    "channel": {
                        "name": channel_snippet.get("title"),
                        "subscribers": channel_stats.get("subscriberCount", 0),
                        "total_views": channel_stats.get("viewCount", 0),
                        "total_videos": channel_stats.get("videoCount", 0),
                        "thumbnail": channel_snippet.get("thumbnails", {}).get("default", {}).get("url"),
                    },
                    "videos": []
                }

            stats_resp = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={"part": "statistics,snippet,contentDetails", "id": ",".join(video_ids)},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            video_stats = {}
            if stats_resp.status_code == 200:
                for v in stats_resp.json().get("items", []):
                    video_stats[v["id"]] = v

            videos = []
            for v in video_items:
                vid_id = v.get("id", {}).get("videoId")
                if not vid_id:
                    continue
                s         = video_stats.get(vid_id, {})
                stat_data = s.get("statistics", {})
                snippet   = s.get("snippet", v.get("snippet", {}))
                videos.append({
                    "id":           vid_id,
                    "title":        snippet.get("title", "Unknown"),
                    "description":  snippet.get("description", "")[:200],
                    "thumbnail":    snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                    "published_at": snippet.get("publishedAt", ""),
                    "views":        int(stat_data.get("viewCount", 0)),
                    "likes":        int(stat_data.get("likeCount", 0)),
                    "comments":     int(stat_data.get("commentCount", 0)),
                    "url":          f"https://www.youtube.com/watch?v={vid_id}",
                })

            videos.sort(key=lambda x: x["views"], reverse=True)
            return {
                "channel": {
                    "name":         channel_snippet.get("title"),
                    "subscribers":  int(channel_stats.get("subscriberCount", 0)),
                    "total_views":  int(channel_stats.get("viewCount", 0)),
                    "total_videos": int(channel_stats.get("videoCount", 0)),
                    "thumbnail":    channel_snippet.get("thumbnails", {}).get("default", {}).get("url"),
                },
                "videos": videos
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ LINKEDIN ============

@router.get("/linkedin/auth")
async def linkedin_auth():
    params = {
        "response_type": "code",
        "client_id":     LINKEDIN_CLIENT_ID,
        "redirect_uri":  f"{FRONTEND_URL}/auth/linkedin/callback",
        "scope":         "openid profile email w_member_social",
        "state":         secrets.token_urlsafe(16),
    }
    url = "https://www.linkedin.com/oauth/v2/authorization?" + urlencode(params)
    return {"url": url}

@router.post("/linkedin/token")
async def linkedin_token(request: Request):
    body = await request.json()
    code = body.get("code")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  f"{FRONTEND_URL}/auth/linkedin/callback",
                "client_id":     LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
            },
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
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.linkedin.com/v2/ugcPosts",
                json={
                    "author": f"urn:li:person:{person_id}",
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary":    {"text": text},
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
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/linkedin/stats")
async def linkedin_stats(access_token: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=resp.text)
        data = resp.json()
        return {
            "name":      data.get("name"),
            "email":     data.get("email"),
            "picture":   data.get("picture"),
            "person_id": data.get("sub"),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
# backend/app/api/social.py
# Twitter (locked) + LinkedIn only
# YouTube has been moved to youtube.py — do NOT add YouTube code here

from fastapi import APIRouter, HTTPException, Request
import os
import httpx
import secrets
from urllib.parse import urlencode

router = APIRouter()

# ── Env vars ──────────────────────────────────────────────────────────────────
LINKEDIN_CLIENT_ID     = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")

APP_ENV      = os.getenv("APP_ENV", "production")
IS_LOCAL     = APP_ENV == "local"
FRONTEND_URL = "http://localhost:5173" if IS_LOCAL else "https://creator-os-ochre.vercel.app"


# ══════════════════════════════════════════════════════════════
# TWITTER — Locked (requires $100/mo paid API plan)
# ══════════════════════════════════════════════════════════════

@router.get("/twitter/auth")
async def twitter_auth():
    raise HTTPException(403, "Twitter/X integration coming soon. Requires paid API plan.")

@router.post("/twitter/token")
async def twitter_token(request: Request):
    raise HTTPException(403, "Twitter/X coming soon.")

@router.post("/twitter/post")
async def twitter_post(request: Request):
    raise HTTPException(403, "Twitter/X posting coming soon.")

@router.get("/twitter/stats")
async def twitter_stats(access_token: str = ""):
    raise HTTPException(403, "Twitter/X stats coming soon.")


# ══════════════════════════════════════════════════════════════
# GOOGLE / YOUTUBE — Stubs only (moved to youtube.py)
# ══════════════════════════════════════════════════════════════

@router.get("/google/auth")
async def google_auth():
    return {"redirect": "/api/youtube/auth",
            "message": "Use /api/youtube/auth?user_id=YOUR_USER_ID"}

@router.post("/google/token")
async def google_token(request: Request):
    return {"message": "Use /api/youtube/auth for YouTube OAuth."}

@router.get("/youtube/connected")
async def youtube_connected():
    return {"message": "Use /api/youtube/status/{user_id}"}

@router.get("/youtube/stats")
async def youtube_stats():
    return {"message": "Use /api/youtube/analytics/{user_id}"}

@router.get("/youtube/videos")
async def youtube_videos():
    return {"message": "Use /api/youtube/videos/{user_id}"}


# ══════════════════════════════════════════════════════════════
# LINKEDIN
# ══════════════════════════════════════════════════════════════

@router.get("/linkedin/auth")
async def linkedin_auth():
    params = {
        "response_type": "code",
        "client_id":     LINKEDIN_CLIENT_ID,
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
            data={
                "grant_type":    "authorization_code",
                "code":          body.get("code"),
                "redirect_uri":  f"{FRONTEND_URL}/auth/linkedin/callback",
                "client_id":     LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if resp.status_code != 200:
        raise HTTPException(400, resp.text)
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
                "author":         f"urn:li:person:{person_id}",
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
        raise HTTPException(400, resp.text)
    return resp.json()

@router.get("/linkedin/stats")
async def linkedin_stats(access_token: str):
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(400, resp.text)
    data = resp.json()
    return {"name": data.get("name"), "email": data.get("email"),
            "picture": data.get("picture"), "person_id": data.get("sub")}
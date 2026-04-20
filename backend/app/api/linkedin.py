# backend/app/api/linkedin.py
# Complete LinkedIn Integration for Nexora OS
# Features: OAuth, Post, Inbox (comments), Reply, Analytics
#
# Add to main.py:
#   from app.api.linkedin import router as linkedin_router
#   app.include_router(linkedin_router)
#
# LinkedIn App Setup:
#   1. developers.linkedin.com → Create App
#   2. Products → Add: "Share on LinkedIn" + "Sign In with LinkedIn using OpenID Connect"
#   3. Auth → Redirect URLs: https://creator-os-production-0bf8.up.railway.app/api/linkedin/callback
#   4. Copy Client ID + Client Secret → Railway env vars

import os
import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client
import secrets

router = APIRouter(prefix="/api/linkedin", tags=["LinkedIn"])

# ── Config ────────────────────────────────────────────────────────────────────
APP_ENV       = os.environ.get("APP_ENV", "production")
IS_LOCAL      = APP_ENV == "local"
CLIENT_ID     = os.environ.get("LINKEDIN_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("LINKEDIN_CLIENT_SECRET", "")

LOCAL_REDIRECT = "http://localhost:8000/api/linkedin/callback"
PROD_REDIRECT  = "https://creator-os-production-0bf8.up.railway.app/api/linkedin/callback"
REDIRECT_URI   = LOCAL_REDIRECT if IS_LOCAL else PROD_REDIRECT

LOCAL_FRONTEND = "http://localhost:5173"
PROD_FRONTEND  = "https://creator-os-ochre.vercel.app"
FRONTEND_URL   = LOCAL_FRONTEND if IS_LOCAL else PROD_FRONTEND

SCOPES = "openid profile email w_member_social"

# LinkedIn API base
LI_API = "https://api.linkedin.com/v2"
LI_REST = "https://api.linkedin.com/rest"

# State store for OAuth
_STATES: dict = {}

# ── Supabase ──────────────────────────────────────────────────────────────────
def get_sb():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )

def get_token(user_id: str, sb) -> tuple[str, str]:
    """Returns (access_token, linkedin_person_id)"""
    try:
        r = sb.table("linkedin_connections") \
            .select("access_token, person_id, name") \
            .eq("user_id", user_id) \
            .maybe_single().execute()
    except Exception:
        r = None

    if r and r.data and r.data.get("access_token"):
        return r.data["access_token"], r.data["person_id"]

    raise HTTPException(401, "LinkedIn not connected. Go to Settings → Social Accounts → Connect LinkedIn.")


# ─────────────────────────────────────────────────────────────────────────────
# 1. OAUTH START
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/auth")
async def linkedin_auth(user_id: str):
    """Start LinkedIn OAuth flow."""
    from urllib.parse import urlencode

    if not CLIENT_ID:
        raise HTTPException(500, "LINKEDIN_CLIENT_ID not set in environment.")

    state = secrets.token_urlsafe(16)
    _STATES[state] = user_id

    params = {
        "response_type": "code",
        "client_id":     CLIENT_ID,
        "redirect_uri":  REDIRECT_URI,
        "scope":         SCOPES,
        "state":         state,
    }
    auth_url = "https://www.linkedin.com/oauth/v2/authorization?" + urlencode(params)
    print(f"[LinkedIn Auth] Starting OAuth for user={user_id[:8]}...")
    return RedirectResponse(auth_url)


# ─────────────────────────────────────────────────────────────────────────────
# 2. OAUTH CALLBACK
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/callback")
async def linkedin_callback(request: Request, sb=Depends(get_sb)):
    params  = dict(request.query_params)
    code    = params.get("code")
    state   = params.get("state")
    error   = params.get("error")

    if error:
        return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_error={error}")

    user_id = _STATES.pop(state, None)
    if not user_id:
        return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_error=invalid_state")

    # Exchange code for token
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            token_r = await c.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type":    "authorization_code",
                    "code":          code,
                    "redirect_uri":  REDIRECT_URI,
                    "client_id":     CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_data = token_r.json()
            print(f"[LinkedIn Callback] Token keys: {list(token_data.keys())}")

        if "error" in token_data:
            return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_error={token_data.get('error_description', 'token_failed')}")

        access_token = token_data["access_token"]

    except Exception as e:
        print(f"[LinkedIn Callback] Token failed: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_error=token_fetch_failed")

    # Get profile info using OpenID
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            profile_r = await c.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            profile = profile_r.json()
            print(f"[LinkedIn Callback] Profile: {profile}")

        person_id = profile.get("sub", "")
        name      = profile.get("name", "LinkedIn User")
        email     = profile.get("email", "")
        picture   = profile.get("picture", "")

    except Exception as e:
        print(f"[LinkedIn Callback] Profile failed: {e}")
        person_id = ""
        name = "LinkedIn User"
        email = picture = ""

    # Save to Supabase
    try:
        sb.table("linkedin_connections").upsert({
            "user_id":      user_id,
            "access_token": access_token,
            "person_id":    person_id,
            "name":         name,
            "email":        email,
            "picture":      picture,
            "connected_at": "now()",
        }, on_conflict="user_id").execute()
        print(f"[LinkedIn Callback] Saved to Supabase. person={person_id}")
    except Exception as e:
        print(f"[LinkedIn Callback] Supabase failed: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_error=db_save_failed")

    return RedirectResponse(f"{FRONTEND_URL}/settings?linkedin_connected=true")


# ─────────────────────────────────────────────────────────────────────────────
# 3. STATUS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/status/{user_id}")
async def linkedin_status(user_id: str, sb=Depends(get_sb)):
    try:
        r = sb.table("linkedin_connections") \
            .select("name, email, picture, person_id, connected_at") \
            .eq("user_id", user_id) \
            .maybe_single().execute()
    except Exception:
        r = None

    if not r or not r.data:
        return {"connected": False}

    return {
        "connected":  True,
        "name":       r.data.get("name"),
        "email":      r.data.get("email"),
        "picture":    r.data.get("picture"),
        "person_id":  r.data.get("person_id"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. DISCONNECT
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/disconnect/{user_id}")
async def linkedin_disconnect(user_id: str, sb=Depends(get_sb)):
    sb.table("linkedin_connections").delete().eq("user_id", user_id).execute()
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# 5. CREATE POST (text + optional image URL)
# ─────────────────────────────────────────────────────────────────────────────
class PostRequest(BaseModel):
    user_id:   str
    text:      str
    image_url: Optional[str] = None
    visibility: str = "PUBLIC"  # PUBLIC | CONNECTIONS

@router.post("/post")
async def linkedin_post(body: PostRequest, sb=Depends(get_sb)):
    """Post to LinkedIn feed. Text only or text + image URL."""
    token, person_id = get_token(body.user_id, sb)

    author = f"urn:li:person:{person_id}"

    post_body = {
        "author":         author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": body.text},
                "shareMediaCategory": "NONE" if not body.image_url else "IMAGE",
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": body.visibility
        },
    }

    # If image provided, add media
    if body.image_url:
        post_body["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
            {
                "status":      "READY",
                "description": {"text": body.text[:200]},
                "originalUrl": body.image_url,
            }
        ]
        post_body["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "ARTICLE"

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            f"{LI_API}/ugcPosts",
            json=post_body,
            headers={
                "Authorization":       f"Bearer {token}",
                "Content-Type":        "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )
        print(f"[LinkedIn Post] Status: {r.status_code}, Body: {r.text[:200]}")

    if r.status_code not in [200, 201]:
        try:
            err = r.json()
            msg = err.get("message", err.get("serviceErrorCode", r.text[:200]))
        except Exception:
            msg = r.text[:200]
        raise HTTPException(400, f"LinkedIn post failed: {msg}")

    post_id = r.headers.get("x-restli-id", "") or (r.json().get("id", "") if r.text else "")

    # Log to Supabase
    try:
        sb.table("scheduled_posts").insert({
            "user_id":      body.user_id,
            "title":        body.text[:80],
            "content":      body.text,
            "platform":     "linkedin",
            "scheduled_at": "now()",
            "status":       "published",
        }).execute()
    except Exception:
        pass

    return {
        "success": True,
        "post_id": post_id,
        "message": "Posted to LinkedIn successfully! ✅"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. GET MY POSTS (feed/activity)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/posts/{user_id}")
async def get_posts(user_id: str, sb=Depends(get_sb)):
    """Fetch recent posts by the user."""
    token, person_id = get_token(user_id, sb)
    author = f"urn:li:person:{person_id}"

    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(
            f"{LI_API}/ugcPosts",
            params={
                "q":         "authors",
                "authors":   f"List({author})",
                "count":     20,
                "sortBy":    "LAST_MODIFIED",
            },
            headers={
                "Authorization":             f"Bearer {token}",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )
        print(f"[LinkedIn Posts] Status: {r.status_code}")

    if r.status_code != 200:
        # Return empty gracefully — LinkedIn posts API requires additional permissions
        return {"posts": [], "total": 0, "note": "Posts require additional LinkedIn permissions."}

    data  = r.json()
    posts = []
    for p in data.get("elements", []):
        content = p.get("specificContent", {}).get("com.linkedin.ugc.ShareContent", {})
        text    = content.get("shareCommentary", {}).get("text", "")
        posts.append({
            "id":           p.get("id", ""),
            "text":         text[:200],
            "created_at":   p.get("created", {}).get("time", 0),
            "lifecycle":    p.get("lifecycleState", ""),
            "visibility":   p.get("visibility", {}).get("com.linkedin.ugc.MemberNetworkVisibility", ""),
        })

    return {"posts": posts, "total": len(posts)}


# ─────────────────────────────────────────────────────────────────────────────
# 7. GET COMMENTS ON A POST
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/comments/{user_id}")
async def get_comments(user_id: str, post_id: Optional[str] = None, sb=Depends(get_sb)):
    """Get comments on user's posts."""
    token, person_id = get_token(user_id, sb)

    if not post_id:
        return {"comments": [], "total": 0, "note": "Provide post_id to fetch comments."}

    # URL encode the post_id (LinkedIn uses URN format)
    from urllib.parse import quote
    encoded_post = quote(post_id, safe='')

    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(
            f"{LI_API}/socialActions/{encoded_post}/comments",
            params={"count": 50},
            headers={
                "Authorization":             f"Bearer {token}",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )
        print(f"[LinkedIn Comments] Status: {r.status_code}")

    if r.status_code != 200:
        return {"comments": [], "total": 0, "error": f"Status {r.status_code}"}

    data     = r.json()
    comments = []
    for c in data.get("elements", []):
        message = c.get("message", {}).get("text", "")
        actor   = c.get("actor", "")
        comments.append({
            "id":         c.get("id", ""),
            "text":       message,
            "actor":      actor,
            "created_at": c.get("created", {}).get("time", 0),
        })

    return {"comments": comments, "total": len(comments)}


# ─────────────────────────────────────────────────────────────────────────────
# 8. REPLY TO A COMMENT
# ─────────────────────────────────────────────────────────────────────────────
class ReplyRequest(BaseModel):
    user_id:    str
    post_id:    str
    comment_id: str
    text:       str

@router.post("/reply-comment")
async def reply_to_comment(body: ReplyRequest, sb=Depends(get_sb)):
    """Reply to a LinkedIn comment."""
    token, person_id = get_token(body.user_id, sb)

    from urllib.parse import quote
    encoded_post    = quote(body.post_id, safe='')
    encoded_comment = quote(body.comment_id, safe='')

    reply_body = {
        "actor":   f"urn:li:person:{person_id}",
        "message": {"text": body.text},
        "parentComment": body.comment_id,
    }

    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            f"{LI_API}/socialActions/{encoded_post}/comments",
            json=reply_body,
            headers={
                "Authorization":             f"Bearer {token}",
                "Content-Type":              "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )

    if r.status_code not in [200, 201]:
        raise HTTPException(400, f"Reply failed: {r.text[:200]}")

    return {"success": True, "message": "Reply posted! ✅"}


# ─────────────────────────────────────────────────────────────────────────────
# 9. PROFILE + ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/analytics/{user_id}")
async def get_analytics(user_id: str, sb=Depends(get_sb)):
    """Get LinkedIn profile info."""
    token, person_id = get_token(user_id, sb)

    async with httpx.AsyncClient(timeout=15) as c:
        profile_r = await c.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {token}"},
        )

    if profile_r.status_code != 200:
        raise HTTPException(400, "Could not fetch LinkedIn profile.")

    p = profile_r.json()

    return {
        "profile": {
            "name":      p.get("name", ""),
            "email":     p.get("email", ""),
            "picture":   p.get("picture", ""),
            "person_id": p.get("sub", ""),
            "locale":    p.get("locale", ""),
        },
        "note": "Follower count and post analytics require LinkedIn Partner Program access."
    }
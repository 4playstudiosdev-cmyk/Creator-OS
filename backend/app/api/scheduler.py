from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone
import httpx
import os
from supabase import create_client
import tweepy

TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_TOKEN_SECRET = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

scheduler = AsyncIOScheduler()

async def post_to_twitter(content: str, access_token: str):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.twitter.com/2/tweets",
            json={"text": content},
            headers={"Authorization": f"Bearer {access_token}"},
        )
    return resp.status_code in [200, 201]

async def post_to_linkedin(content: str, access_token: str, person_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.linkedin.com/v2/ugcPosts",
            json={
                "author": f"urn:li:person:{person_id}",
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {"text": content},
                        "shareMediaCategory": "NONE",
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                },
            },
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
        )
    return resp.status_code in [200, 201]

async def check_and_publish_posts():
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        now = datetime.now(timezone.utc).isoformat()

        result = supabase.from_("scheduled_posts") \
            .select("*") \
            .eq("status", "scheduled") \
            .eq("post_now", False) \
            .lte("scheduled_for", now) \
            .execute()

        posts = result.data or []
        print(f"[Scheduler] Checking posts... Found {len(posts)} ready to publish")

        for post in posts:
            platforms = post.get("platforms", [])
            content = post.get("content", "")
            user_id = post.get("user_id")
            post_id = post.get("id")

            # User tokens fetch karo
            tokens_result = supabase.from_("social_tokens") \
                .select("*") \
                .eq("user_id", user_id) \
                .execute()

            tokens = {t["platform"]: t for t in (tokens_result.data or [])}

            # Agar koi token nahi to skip karo
            if not tokens:
                print(f"[Scheduler] Post {post_id} — No tokens found, skipping!")
                supabase.from_("scheduled_posts") \
                    .update({"status": "draft"}) \
                    .eq("id", post_id) \
                    .execute()
                continue

            success_platforms = []
            failed_platforms = []

            if "Twitter" in platforms and "twitter" in tokens:
                token = tokens["twitter"]["access_token"]
                ok = await post_to_twitter(content, token)
                if ok:
                    success_platforms.append("Twitter")
                else:
                    failed_platforms.append("Twitter")

            if "LinkedIn" in platforms and "linkedin" in tokens:
                token = tokens["linkedin"]["access_token"]
                person_id = tokens["linkedin"].get("person_id", "")
                ok = await post_to_linkedin(content, token, person_id)
                if ok:
                    success_platforms.append("LinkedIn")
                else:
                    failed_platforms.append("LinkedIn")

            new_status = "published" if success_platforms else "failed"
            supabase.from_("scheduled_posts") \
                .update({
                    "status": new_status,
                    "published_at": datetime.now(timezone.utc).isoformat(),
                    "published_platforms": success_platforms,
                }) \
                .eq("id", post_id) \
                .execute()

            print(f"[Scheduler] Post {post_id} → {new_status} | Platforms: {success_platforms}")

    except Exception as e:
        print(f"[Scheduler] Error: {e}")

def start_scheduler():
    scheduler.add_job(check_and_publish_posts, "interval", minutes=1)
    scheduler.start()
    print("[Scheduler] Started — checking every minute!")
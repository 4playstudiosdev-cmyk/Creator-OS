# backend/app/api/scheduler.py
# Nexora OS — Background Post Scheduler
# Runs every minute, checks for posts due to publish

import os
import asyncio
import httpx
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from supabase import create_client

SUPABASE_URL     = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY     = os.environ.get("SUPABASE_SERVICE_KEY", "")
API_BASE         = "http://localhost:8080"  # internal

scheduler = AsyncIOScheduler()

def get_sb():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

async def publish_post(post: dict, sb) -> bool:
    """Try to publish a scheduled post to its platforms."""
    uid      = post.get("user_id")
    content  = post.get("content") or post.get("caption") or ""
    platforms_raw = post.get("platforms") or []

    # Handle platforms field — could be array or string
    if isinstance(platforms_raw, str):
        platforms = [platforms_raw]
    elif isinstance(platforms_raw, list):
        platforms = [p for p in platforms_raw if p]
    else:
        platforms = []

    if not platforms:
        print(f"[Scheduler] Post {post['id']} → skipping (no platforms set)")
        return False

    if not content:
        print(f"[Scheduler] Post {post['id']} → skipping (no content)")
        return False

    print(f"[Scheduler] Publishing post {post['id'][:8]} to {platforms}")
    success = False

    async with httpx.AsyncClient(timeout=30) as c:
        for platform in platforms:
            try:
                if platform == "instagram":
                    media_url = post.get("media_url")
                    if not media_url:
                        print(f"[Scheduler] Instagram post {post['id'][:8]} — no media_url, marking needs_media")
                        sb.table("scheduled_posts").update({"status":"needs_media"}).eq("id",post["id"]).execute()
                        continue

                    # Try image post
                    print(f"[Scheduler] Instagram posting with image: {media_url[:60]}")
                    r = await c.post(f"{API_BASE}/api/instagram/post", json={
                        "user_id":   uid,
                        "caption":   content,
                        "image_url": media_url,
                    })
                    resp_text = r.text[:200]
                    print(f"[Scheduler] Instagram response: {r.status_code} — {resp_text}")
                    success = r.status_code in [200, 201]

                elif platform == "linkedin":
                    r = await c.post(f"{API_BASE}/api/linkedin/post", json={
                        "user_id":    uid,
                        "text":       content,
                        "visibility": post.get("privacy", "PUBLIC").upper(),
                    })
                    success = r.status_code == 200

                elif platform == "youtube":
                    # YouTube videos uploaded via UI are already published
                    # Only skip if status is already published
                    if post.get("status") == "published":
                        print(f"[Scheduler] YouTube post {post['id'][:8]} already published — skipping")
                        success = True
                    else:
                        print(f"[Scheduler] YouTube requires video file — cannot auto-post, marking needs_media")
                        sb.table("scheduled_posts").update({"status":"needs_media"}).eq("id",post["id"]).execute()
                        continue

                elif platform == "tiktok":
                    print(f"[Scheduler] TikTok requires video file — skipping auto-post")
                    success = True

                else:
                    print(f"[Scheduler] Platform {platform} not supported for auto-post")
                    continue

                print(f"[Scheduler] {platform} → {'✅' if success else '❌'}")

            except Exception as e:
                print(f"[Scheduler] {platform} error: {e}")

    return success


async def check_and_publish():
    """Main scheduler job — runs every minute."""
    try:
        sb = get_sb()
        now = datetime.now(timezone.utc).isoformat()

        # Find posts due to publish
        result = sb.table("scheduled_posts") \
            .select("*") \
            .eq("status", "scheduled") \
            .lte("scheduled_for", now) \
            .execute()

        posts = result.data or []
        print(f"[Scheduler] Checking posts... Found {len(posts)} ready to publish")

        for post in posts:
            try:
                success = await publish_post(post, sb)

                # Update status
                new_status = "published" if success else "failed"
                sb.table("scheduled_posts").update({
                    "status":       new_status,
                    "published_at": now,
                }).eq("id", post["id"]).execute()

                print(f"[Scheduler] Post {post['id'][:8]} → {new_status}")

            except Exception as e:
                print(f"[Scheduler] Post {post['id'][:8]} error: {e}")
                sb.table("scheduled_posts").update({ "status": "failed" }).eq("id", post["id"]).execute()

    except Exception as e:
        print(f"[Scheduler] Job error: {e}")


def start_scheduler():
    """Start the background scheduler."""
    scheduler.add_job(check_and_publish, "interval", minutes=1, id="post_scheduler", replace_existing=True)
    scheduler.start()
    print("[Scheduler] Started — checking every minute!")
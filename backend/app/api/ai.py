from fastapi import APIRouter, HTTPException, Request
from groq import Groq
import os
import json
from youtube_transcript_api import YouTubeTranscriptApi

router = APIRouter()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ============ REPURPOSE ============

@router.post("/repurpose")
async def repurpose_content(request: Request):
    body = await request.json()
    content = body.get("content", "")
    platform = body.get("platform", "twitter")
    youtube_url = body.get("youtube_url", "")

    source_text = content

    if youtube_url:
        try:
            video_id = youtube_url.split("v=")[-1].split("&")[0]
            ytt = YouTubeTranscriptApi()
            fetched = ytt.fetch(video_id)
            transcript_text = " ".join([entry.text for entry in fetched])
            source_text = transcript_text[:3000]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Transcript error: {str(e)}")

    if not source_text:
        raise HTTPException(status_code=400, detail="Content ya YouTube URL dena zaroori hai")

    platform_prompts = {
        "twitter": "Twitter thread banao. 5-7 tweets, har tweet max 280 characters. Number karo 1/, 2/ etc.",
        "linkedin": "LinkedIn post banao. Professional tone, engaging, 150-300 words. Emojis use karo.",
        "instagram": "Instagram caption banao. Engaging, 100-150 words. Relevant hashtags add karo.",
        "youtube": "YouTube description banao. SEO optimized, 200-300 words. Timestamps aur hashtags add karo.",
        "newsletter": "Email newsletter section banao. Conversational tone, 200-250 words.",
    }

    prompt = f"""
{platform_prompts.get(platform, 'Social media post banao.')}

Source content:
{source_text[:2000]}

Sirf post content return karo, koi explanation nahi.
"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7,
        )
        result = completion.choices[0].message.content.strip()
        return {"result": result, "platform": platform}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ AI TOOLS ============

@router.post("/ideas")
async def generate_ideas(request: Request):
    body = await request.json()
    niche = body.get("niche", "content creation")
    platform = body.get("platform", "YouTube")
    count = body.get("count", 10)

    prompt = f"""Generate {count} unique, viral content ideas for {platform} about {niche}.
Return ONLY a valid JSON array like this (no extra text, no markdown):
[
  {{"title": "idea title", "hook": "opening hook", "format": "video/post/reel", "viral_score": 8}},
  {{"title": "idea title", "hook": "opening hook", "format": "video/post/reel", "viral_score": 7}}
]"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.8,
        )
        text = completion.choices[0].message.content.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        start = text.find('[')
        end = text.rfind(']')
        if start != -1 and end != -1:
            text = text[start:end+1]
        parsed = json.loads(text)
        return {"ideas": parsed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ab-test")
async def ab_test(request: Request):
    body = await request.json()
    content = body.get("content", "")
    platform = body.get("platform", "YouTube")

    prompt = f"""Create 3 A/B test variations of this {platform} content.
Return ONLY valid JSON array (no extra text, no markdown):
[
  {{"variant": "A", "title": "variation title", "hook": "opening line", "predicted_ctr": "4.2%", "reason": "why this works"}},
  {{"variant": "B", "title": "variation title", "hook": "opening line", "predicted_ctr": "3.8%", "reason": "why this works"}},
  {{"variant": "C", "title": "variation title", "hook": "opening line", "predicted_ctr": "5.1%", "reason": "why this works"}}
]

Original content: {content}"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.7,
        )
        text = completion.choices[0].message.content.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        start = text.find('[')
        end = text.rfind(']')
        if start != -1 and end != -1:
            text = text[start:end+1]
        parsed = json.loads(text)
        return {"variants": parsed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hashtags")
async def generate_hashtags(request: Request):
    body = await request.json()
    content = body.get("content", "")
    platform = body.get("platform", "Instagram")

    prompt = f"""Generate hashtags and viral score for this {platform} content.
Return ONLY valid JSON object (no extra text, no markdown):
{{
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "viral_score": 8.5,
  "viral_reason": "Why this will perform well",
  "best_posting_time": "Best time to post"
}}

Content: {content}"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.6,
        )
        text = completion.choices[0].message.content.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            text = text[start:end+1]
        parsed = json.loads(text)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calendar-fill")
async def calendar_fill(request: Request):
    body = await request.json()
    niche = body.get("niche", "content creation")
    platforms = body.get("platforms", ["YouTube", "LinkedIn"])
    days = body.get("days", 7)

    prompt = f"""Create a {days}-day content calendar for {', '.join(platforms)} about {niche}.
Return ONLY valid JSON array (no extra text, no markdown):
[
  {{
    "day": 1,
    "date_label": "Monday",
    "platform": "YouTube",
    "content_type": "Video",
    "title": "content title",
    "hook": "opening hook",
    "best_time": "9:00 AM"
  }}
]
Make exactly {days} items."""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.7,
        )
        text = completion.choices[0].message.content.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        start = text.find('[')
        end = text.rfind(']')
        if start != -1 and end != -1:
            text = text[start:end+1]
        parsed = json.loads(text)
        return {"calendar": parsed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ SCRIPT STUDIO ============

@router.post("/script")
async def generate_script(request: Request):
    body = await request.json()
    topic = body.get("topic", "")
    platform = body.get("platform", "YouTube")
    duration = body.get("duration", "5 minutes")
    tone = body.get("tone", "Educational")
    target_audience = body.get("target_audience", "General audience")

    if not topic:
        raise HTTPException(status_code=400, detail="Topic zaroori hai")

    # Duration ke hisaab se sections adjust karo
    section_count = {
        "30 seconds": 2,
        "60 seconds": 2,
        "3 minutes": 3,
        "5 minutes": 4,
        "10 minutes": 5,
        "15+ minutes": 6,
    }.get(duration, 4)

    prompt = f"""You are an expert video scriptwriter. Write a complete {platform} video script.

Topic: {topic}
Duration: {duration}
Tone: {tone}
Target Audience: {target_audience}
Number of main sections: {section_count}

Return ONLY a valid JSON object. No markdown, no explanation, no text before or after JSON.

{{
  "title": "catchy video title here",
  "hook": "attention grabbing first 3-5 seconds script here",
  "intro": "intro script 15-20 seconds here",
  "sections": [
    {{"heading": "section name", "script": "full script content here", "duration": "X seconds/minutes"}}
  ],
  "cta": "call to action script here",
  "outro": "outro script here",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "thumbnail_idea": "thumbnail description here",
  "b_roll_suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}}"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=8000,
            temperature=0.7,
        )
        text = completion.choices[0].message.content.strip()
        print(f"[Script] Raw response length: {len(text)}")
        print(f"[Script] First 200 chars: {text[:200]}")

        # Clean markdown
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        # Extract JSON safely
        start = text.find('{')
        end = text.rfind('}')
        if start == -1 or end == -1:
            raise HTTPException(status_code=500, detail="AI ne JSON return nahi kiya")
        text = text[start:end+1]

        parsed = json.loads(text)

        # Validate required fields
        required = ["title", "hook", "intro", "sections", "cta", "outro", "hashtags"]
        for field in required:
            if field not in parsed:
                parsed[field] = "" if field != "sections" else []

        return parsed

    except json.JSONDecodeError as e:
        print(f"[Script] JSON Error: {e}")
        print(f"[Script] Problematic text: {text[:500]}")
        raise HTTPException(status_code=500, detail=f"JSON parse error — try again")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Script] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# backend/app/api/ai_proxy.py
# Nexora OS — AI Proxy for Frontend
# Repurpose Engine, Script Studio, Hook Generator — all via Groq

import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from groq import Groq

router = APIRouter(prefix="/api/ai", tags=["AI"])

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MODEL = "llama-3.3-70b-versatile"

def get_groq():
    if not GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY not configured")
    return Groq(api_key=GROQ_API_KEY)


# ── 1. REPURPOSE ENGINE ────────────────────────────────────────────────────
class RepurposeRequest(BaseModel):
    input:     str
    platforms: List[str]
    tone:      str = "viral"
    length:    str = "medium"
    audience:  str = "General"
    plat_opts: Optional[dict] = None
    brand_tone: Optional[str] = None

@router.post("/repurpose")
async def repurpose_content(body: RepurposeRequest):
    client = get_groq()

    plat_details = []
    for pid in body.platforms:
        limits = {"twitter":280,"instagram":2200,"linkedin":3000,"tiktok":2200,"youtube":5000,"facebook":9999}
        opts = (body.plat_opts or {}).get(pid, {})
        extra = ""
        if pid == "twitter":
            tl = opts.get("thread_length", "7 tweets")
            extra = f"Format as numbered thread (1/ 2/ etc). Length: {tl}"
        elif pid == "instagram":
            extra = "Include 20-25 relevant hashtags at end." if opts.get("hashtags") else "No hashtags."
        elif pid == "linkedin":
            extra = "Thought-leadership style with personal story." if opts.get("thought_lead") else "Professional with clear value."
        elif pid == "tiktok":
            extra = f"Hook intensity: {opts.get('hook','High')}. Start with strongest hook possible."
        elif pid == "youtube":
            extra = "YouTube description with chapters/timestamps structure."
        plat_details.append(f"- {pid} (max {limits.get(pid,2000)} chars): {extra}")

    prompt = f"""Repurpose this content for multiple social platforms.

CONTENT:
\"\"\"{body.input[:2000]}\"\"\"

SETTINGS:
- Tone: {body.tone}
- Length: {body.length}  
- Audience: {body.audience}
{f'- Brand voice: {body.brand_tone}' if body.brand_tone else ''}

PLATFORM REQUIREMENTS:
{chr(10).join(plat_details)}

Return ONLY this JSON (no markdown, no extra text):
{{
  "platforms": {{
    {', '.join([f'"{p}": {{"content": "optimized content here", "score": 82, "virality": "high", "best_time": "6 PM", "tip": "one tip"}}' for p in body.platforms])}
  }}
}}"""

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role":"system","content":"You are a viral content strategist. Return ONLY valid JSON."},
                {"role":"user","content":prompt}
            ],
            temperature=0.7,
            max_tokens=3000,
        )
        text = resp.choices[0].message.content or ""
        # Extract JSON
        start = text.find("{")
        end   = text.rfind("}") + 1
        if start == -1: raise ValueError("No JSON found")
        parsed = json.loads(text[start:end])
        return parsed
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI response parse error: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"AI error: {str(e)}")


# ── 2. SCRIPT GENERATOR ────────────────────────────────────────────────────
class ScriptRequest(BaseModel):
    topic:      str
    platform:   str = "youtube"
    duration:   str = "5m"
    tone:       str = "educational"
    energy:     int = 70
    complexity: int = 50
    scene_mode: bool = False
    fast_mode:  bool = False
    hook:       Optional[str] = None

@router.post("/script")
async def generate_script(body: ScriptRequest):
    client = get_groq()

    dur_map = {"30s":"30 seconds ~75 words","60s":"60 seconds ~150 words","3m":"3 minutes ~450 words","5m":"5 minutes ~750 words","10m":"10 minutes ~1500 words","15m":"15+ minutes 2000+ words"}
    dur_label = dur_map.get(body.duration, "5 minutes ~750 words")

    energy_desc = "high-energy, fast-paced" if body.energy > 70 else "moderate pace" if body.energy > 40 else "calm, measured"
    complexity_desc = "expert level" if body.complexity > 70 else "intermediate" if body.complexity > 40 else "beginner-friendly"

    scenes_instruction = "Include scene-by-scene breakdown with camera directions." if body.scene_mode else "Include basic scene breakdown."

    prompt = f"""Write a complete {dur_label} {body.platform} script.

Topic: {body.topic}
Tone: {body.tone}
Energy: {body.energy}/100 ({energy_desc})
Complexity: {body.complexity}/100 ({complexity_desc})
{f'Opening hook: "{body.hook}"' if body.hook else ''}
{'Fast-paced style with pattern interrupts every 15-20 seconds.' if body.fast_mode else ''}
{scenes_instruction}

Return ONLY this JSON (no markdown):
{{
  "full_script": "Complete word-for-word script",
  "scenes": [
    {{"name":"Hook","duration":"0-3s","content":"exact words","camera":"Camera direction","emoji":"🎣"}},
    {{"name":"Problem","duration":"3-15s","content":"exact words","camera":"Direction","emoji":"❗"}},
    {{"name":"Solution","duration":"15-60s","content":"exact words","camera":"Direction","emoji":"💡"}},
    {{"name":"Proof","duration":"60-120s","content":"exact words","camera":"Direction","emoji":"📖"}},
    {{"name":"CTA","duration":"last 5s","content":"exact words","camera":"Direction","emoji":"📣"}}
  ],
  "score": {{"hook_strength":85,"retention_score":78,"cta_strength":72,"overall":78}},
  "feedback": {{"hook":"Hook feedback","retention":"Retention note","cta":"CTA tip"}},
  "word_count": 450,
  "estimated_duration": "4 min 30 sec"
}}"""

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role":"system","content":"You are a world-class content script writer. Return ONLY valid JSON."},
                {"role":"user","content":prompt}
            ],
            temperature=0.7,
            max_tokens=4000,
        )
        text = resp.choices[0].message.content or ""
        start = text.find("{"); end = text.rfind("}") + 1
        if start == -1: raise ValueError("No JSON")
        return json.loads(text[start:end])
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"Parse error: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Script error: {str(e)}")


# ── 3. HOOK GENERATOR ─────────────────────────────────────────────────────
class HookRequest(BaseModel):
    topic:    str
    platform: str = "youtube"
    tone:     str = "educational"

@router.post("/hooks")
async def generate_hooks(body: HookRequest):
    client = get_groq()

    prompt = f"""Generate 5 diverse high-performing hooks for:
Topic: "{body.topic}"
Platform: {body.platform}
Tone: {body.tone}

Return ONLY this JSON:
{{
  "hooks": [
    {{"style":"Question Hook","text":"hook text here","why":"why this works"}},
    {{"style":"Shock Stat","text":"hook text","why":"why"}},
    {{"style":"Story Hook","text":"hook text","why":"why"}},
    {{"style":"Controversial","text":"hook text","why":"why"}},
    {{"style":"Promise Hook","text":"hook text","why":"why"}}
  ]
}}"""

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role":"system","content":"You are a viral content hook expert. Return ONLY valid JSON."},
                {"role":"user","content":prompt}
            ],
            temperature=0.8,
            max_tokens=800,
        )
        text = resp.choices[0].message.content or ""
        start = text.find("{"); end = text.rfind("}") + 1
        if start == -1: raise ValueError("No JSON")
        return json.loads(text[start:end])
    except Exception as e:
        raise HTTPException(500, f"Hook error: {str(e)}")


# ── 4. HEALTH CHECK ───────────────────────────────────────────────────────
@router.get("/health")
async def ai_health():
    return {"status":"ok","model":MODEL,"groq_key":bool(GROQ_API_KEY)}
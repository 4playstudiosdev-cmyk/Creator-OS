# backend/app/api/video_editor.py
# Creatomate Video Editor for Nexora OS
# Features: Upload video → Apply effects/captions/transitions → Export MP4

import os
import httpx
import asyncio
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from supabase import create_client

router = APIRouter(prefix="/api/editor", tags=["Video Editor"])

CREATOMATE_API_KEY = os.environ.get("CREATOMATE_API_KEY", "")
CREATOMATE_BASE    = "https://api.creatomate.com/v1"
SUPABASE_URL       = os.environ.get("SUPABASE_URL", "")

def get_sb():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

def cm_headers():
    return {
        "Authorization": f"Bearer {CREATOMATE_API_KEY}",
        "Content-Type":  "application/json",
    }

# ─────────────────────────────────────────────────────────────────────────────
# 1. GET TEMPLATES
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/templates")
async def get_templates():
    """Get all available Creatomate templates."""
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{CREATOMATE_BASE}/templates", headers=cm_headers())
    if r.status_code != 200:
        raise HTTPException(400, f"Templates fetch failed: {r.text[:200]}")
    templates = r.json()

    # Categorize templates
    result = []
    for t in templates:
        result.append({
            "id":          t.get("id"),
            "name":        t.get("name"),
            "thumbnail":   t.get("thumbnail_url"),
            "duration":    t.get("duration"),
            "format":      t.get("output_format", "mp4"),
            "width":       t.get("width"),
            "height":      t.get("height"),
            "tags":        t.get("tags", []),
        })
    return {"templates": result, "total": len(result)}


# ─────────────────────────────────────────────────────────────────────────────
# 2. UPLOAD VIDEO TO SUPABASE → get public URL
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload-video")
async def upload_video(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    sb = Depends(get_sb)
):
    """Upload video to Supabase storage, return public URL for Creatomate."""
    content  = await file.read()
    ext      = file.filename.split('.')[-1] if file.filename else 'mp4'
    filename = f"editor/{user_id}/{uuid.uuid4()}.{ext}"

    try:
        sb.storage.from_("posts").upload(filename, content, {"content-type": file.content_type or "video/mp4", "upsert": "true"})
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/posts/{filename}"
    return {
        "url":      public_url,
        "filename": filename,
        "size_mb":  round(len(content) / 1024 / 1024, 2),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. RENDER — Apply effects, captions, transitions
# ─────────────────────────────────────────────────────────────────────────────
class RenderRequest(BaseModel):
    user_id:     str
    video_url:   str          # Public URL of video
    template_id: Optional[str] = None  # Use template OR custom composition
    modifications: Optional[dict] = None

    # Custom options (used when no template)
    caption_text:   Optional[str]  = None   # Burn captions
    caption_style:  str = "bottom_white"    # bottom_white | center_bold | tiktok
    overlay_text:   Optional[str]  = None   # Title overlay
    overlay_color:  str = "#ffffff"
    bg_music_url:   Optional[str]  = None   # Background music
    bg_music_vol:   float = 0.3             # 0.0 - 1.0
    transition:     str = "none"            # none | fade | slide | zoom | wipe
    output_format:  str = "mp4"
    aspect_ratio:   str = "9:16"            # 9:16 | 16:9 | 1:1
    trim_start:     Optional[float] = None
    trim_end:       Optional[float] = None


def build_composition(body: RenderRequest) -> dict:
    """Build Creatomate JSON composition from options."""
    # Dimensions based on aspect ratio
    dims = {
        "9:16":  {"width": 1080, "height": 1920},
        "16:9":  {"width": 1920, "height": 1080},
        "1:1":   {"width": 1080, "height": 1080},
        "4:5":   {"width": 1080, "height": 1350},
    }
    dim = dims.get(body.aspect_ratio, dims["9:16"])

    # Base video element
    video_el = {
        "type":   "video",
        "source": body.video_url,
        "fit":    "cover",
        "width":  "100%",
        "height": "100%",
    }
    if body.trim_start is not None:
        video_el["time"] = body.trim_start
    if body.trim_end is not None:
        video_el["trim_end"] = body.trim_end

    # Transition on video
    if body.transition and body.transition != "none":
        video_el["animations"] = [{
            "time":     "end",
            "duration": 0.5,
            "easing":   "quadratic-out",
            "type":     body.transition,
        }]

    elements = [video_el]

    # Caption / subtitle styles
    caption_styles = {
        "bottom_white": {
            "type":              "text",
            "text":              body.caption_text or "",
            "y":                 "85%",
            "width":             "90%",
            "x_alignment":       "50%",
            "font_size":         "5 vmin",
            "font_weight":       "700",
            "color":             "#ffffff",
            "background_color":  "rgba(0,0,0,0.6)",
            "background_x_padding": "3 vmin",
            "background_y_padding": "1.5 vmin",
            "background_border_radius": "1 vmin",
        },
        "center_bold": {
            "type":        "text",
            "text":        body.caption_text or "",
            "y":           "50%",
            "width":       "90%",
            "x_alignment": "50%",
            "y_alignment": "50%",
            "font_size":   "7 vmin",
            "font_weight": "900",
            "color":       "#ffffff",
            "text_shadow": "0 2px 8px rgba(0,0,0,0.8)",
        },
        "tiktok": {
            "type":              "text",
            "text":              body.caption_text or "",
            "y":                 "80%",
            "width":             "95%",
            "x_alignment":       "50%",
            "font_size":         "6 vmin",
            "font_weight":       "900",
            "color":             "#fffc00",
            "text_shadow":       "0 2px 4px rgba(0,0,0,1)",
            "background_color":  "rgba(0,0,0,0)",
        },
    }

    if body.caption_text:
        elements.append(caption_styles.get(body.caption_style, caption_styles["bottom_white"]))

    # Text overlay (title)
    if body.overlay_text:
        elements.append({
            "type":        "text",
            "text":        body.overlay_text,
            "y":           "10%",
            "width":       "90%",
            "x_alignment": "50%",
            "font_size":   "5 vmin",
            "font_weight": "700",
            "color":       body.overlay_color,
            "text_shadow": "0 2px 8px rgba(0,0,0,0.7)",
        })

    # Background music
    if body.bg_music_url:
        elements.append({
            "type":   "audio",
            "source": body.bg_music_url,
            "volume": body.bg_music_vol,
        })

    return {
        "output_format": body.output_format,
        "width":         dim["width"],
        "height":        dim["height"],
        "elements":      elements,
    }


@router.post("/render")
async def render_video(body: RenderRequest):
    """Render video with effects using Creatomate."""
    if not CREATOMATE_API_KEY:
        raise HTTPException(500, "CREATOMATE_API_KEY not configured.")

    if body.template_id:
        # Use existing template
        payload = {
            "template_id":   body.template_id,
            "modifications": body.modifications or {
                "Video.source": body.video_url,
            },
        }
    else:
        # Custom composition
        payload = {
            "source": build_composition(body),
        }

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            f"{CREATOMATE_BASE}/renders",
            headers=cm_headers(),
            json=payload,
        )
        d = r.json()
        print(f"[Creatomate Render] Status: {r.status_code}, Response: {str(d)[:200]}")

    if r.status_code not in [200, 201]:
        raise HTTPException(400, f"Render failed: {r.text[:300]}")

    renders = d if isinstance(d, list) else [d]
    render  = renders[0]

    return {
        "render_id": render.get("id"),
        "status":    render.get("status"),
        "message":   "Render started! Poll status endpoint.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. POLL RENDER STATUS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/render/{render_id}")
async def get_render_status(render_id: str):
    """Poll render status and get download URL when done."""
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            f"{CREATOMATE_BASE}/renders/{render_id}",
            headers=cm_headers(),
        )
        d = r.json()

    status = d.get("status", "unknown")
    return {
        "render_id":    render_id,
        "status":       status,          # planned | rendering | succeeded | failed
        "progress":     d.get("progress", 0),
        "download_url": d.get("url") if status == "succeeded" else None,
        "error":        d.get("error_message") if status == "failed" else None,
        "duration":     d.get("duration"),
        "file_size":    d.get("file_size"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. QUICK PRESETS
# ─────────────────────────────────────────────────────────────────────────────
class QuickPresetRequest(BaseModel):
    user_id:   str
    video_url: str
    preset:    str  # shorts | youtube | instagram | tiktok | cinematic
    text:      Optional[str] = None
    music_url: Optional[str] = None

PRESETS = {
    "shorts": {
        "aspect_ratio":  "9:16",
        "caption_style": "tiktok",
        "transition":    "fade",
    },
    "youtube": {
        "aspect_ratio":  "16:9",
        "caption_style": "bottom_white",
        "transition":    "fade",
    },
    "instagram": {
        "aspect_ratio":  "1:1",
        "caption_style": "center_bold",
        "transition":    "slide",
    },
    "tiktok": {
        "aspect_ratio":  "9:16",
        "caption_style": "tiktok",
        "transition":    "zoom",
    },
    "cinematic": {
        "aspect_ratio":  "16:9",
        "caption_style": "bottom_white",
        "transition":    "fade",
        "overlay_text":  None,
    },
}

@router.post("/quick-preset")
async def quick_preset(body: QuickPresetRequest):
    """Apply a quick preset to video."""
    preset = PRESETS.get(body.preset, PRESETS["shorts"])
    render_body = RenderRequest(
        user_id      = body.user_id,
        video_url    = body.video_url,
        caption_text = body.text,
        bg_music_url = body.music_url,
        bg_music_vol = 0.25,
        **preset,
    )
    return await render_video(render_body)
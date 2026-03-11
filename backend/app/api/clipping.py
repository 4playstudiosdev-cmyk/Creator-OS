from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
import os
import tempfile
import subprocess
import json
import uuid
from groq import Groq
from typing import Optional

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Temp folder for clips (in production, use S3/cloud storage)
CLIPS_DIR = tempfile.gettempdir()


def get_val(obj, key, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def run_ffmpeg(args: list, timeout: int = 300) -> subprocess.CompletedProcess:
    result = subprocess.run(
        ["ffmpeg"] + args,
        capture_output=True, text=True, timeout=timeout
    )
    return result


def get_video_duration(path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_format", path],
        capture_output=True, text=True
    )
    try:
        info = json.loads(result.stdout)
        return float(info["format"]["duration"])
    except Exception:
        return 0.0


@router.post("/detect-clips")
async def detect_clips(
    file: UploadFile = File(...),
    clip_duration: int = Form(60),     # 30, 60, 90 seconds
    max_clips: int = Form(5),
    aspect_ratio: str = Form("9:16"),  # "9:16" portrait OR "16:9" landscape
):
    """
    1. Save video
    2. Extract audio → Whisper transcription
    3. Groq AI → detect best moments
    4. ffmpeg → cut clips
    5. Return clip metadata + download URLs
    """

    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Video file zaroori hai")

    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    tmp_video = None
    tmp_audio = None
    clips_info = []

    try:
        # ── 1. Save video ─────────────────────────────────────────
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
            content = await file.read()
            f.write(content)
            tmp_video = f.name

        print(f"[Clipping] Video saved: {tmp_video} ({len(content)} bytes)")

        video_duration = get_video_duration(tmp_video)
        print(f"[Clipping] Duration: {video_duration:.1f}s")

        if video_duration < clip_duration:
            raise HTTPException(
                status_code=400,
                detail=f"Video ({video_duration:.0f}s) clip duration ({clip_duration}s) se choti hai"
            )

        # ── 2. Extract audio for Whisper ──────────────────────────
        tmp_audio = tmp_video.replace(suffix, "_audio.mp3")
        r = run_ffmpeg([
            "-i", tmp_video,
            "-vn", "-acodec", "libmp3lame",
            "-ar", "16000", "-ac", "1", "-ab", "64k",
            "-y", tmp_audio
        ])
        if r.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Audio extract failed: {r.stderr[-200:]}")

        audio_size = os.path.getsize(tmp_audio)
        print(f"[Clipping] Audio: {audio_size} bytes")

        # ── 3. Whisper transcription ───────────────────────────────
        print("[Clipping] Transcribing with Whisper...")
        with open(tmp_audio, "rb") as af:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(tmp_audio), af, "audio/mp3"),
                model="whisper-large-v3",
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        if isinstance(transcription, dict):
            segments_raw = transcription.get("segments", [])
            full_text    = transcription.get("text", "")
        else:
            segments_raw = getattr(transcription, "segments", []) or []
            full_text    = getattr(transcription, "text", "") or ""

        print(f"[Clipping] Got {len(segments_raw)} segments")

        # Build transcript with timestamps
        transcript_lines = []
        for seg in segments_raw:
            start = float(get_val(seg, "start") or 0)
            end   = float(get_val(seg, "end")   or 0)
            text  = (get_val(seg, "text") or "").strip()
            if text:
                transcript_lines.append(f"[{start:.1f}s - {end:.1f}s] {text}")

        transcript_for_ai = "\n".join(transcript_lines[:150])  # limit tokens

        # ── 4. Groq AI → best moment timestamps ───────────────────
        print("[Clipping] Asking Groq AI for best moments...")

        ai_prompt = f"""You are a viral content expert. Analyze this video transcript and find the {max_clips} most engaging moments for short-form content (YouTube Shorts / TikTok / Reels).

Video duration: {video_duration:.0f} seconds
Clip length needed: {clip_duration} seconds each

Transcript:
{transcript_for_ai}

Find {max_clips} best moments. Each clip must be exactly {clip_duration} seconds.
Make sure start_time + {clip_duration} <= {video_duration:.0f}

Return ONLY valid JSON, no other text:
{{
  "clips": [
    {{
      "start_time": 12.5,
      "end_time": {clip_duration + 12.5},
      "title": "Clip title here",
      "reason": "Why this moment is viral",
      "hook": "First line that will grab attention",
      "engagement_score": 92
    }}
  ]
}}"""

        ai_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": ai_prompt}],
            max_tokens=1500,
            temperature=0.3,
        )

        ai_text = ai_response.choices[0].message.content.strip()
        print(f"[Clipping] AI response length: {len(ai_text)}")

        # Parse JSON
        try:
            start_idx = ai_text.find("{")
            end_idx   = ai_text.rfind("}") + 1
            ai_data   = json.loads(ai_text[start_idx:end_idx])
            suggested_clips = ai_data.get("clips", [])
        except Exception as e:
            print(f"[Clipping] JSON parse error: {e}, using fallback")
            # Fallback: evenly spaced clips
            suggested_clips = []
            step = (video_duration - clip_duration) / max(max_clips, 1)
            for i in range(min(max_clips, int(video_duration // clip_duration))):
                st = round(i * step, 1)
                suggested_clips.append({
                    "start_time": st,
                    "end_time": round(st + clip_duration, 1),
                    "title": f"Clip {i+1}",
                    "reason": "Auto-generated clip",
                    "hook": "",
                    "engagement_score": 80 - i * 5,
                })

        # ── 5. Cut clips with ffmpeg ───────────────────────────────
        print(f"[Clipping] Cutting {len(suggested_clips)} clips...")

        for i, clip in enumerate(suggested_clips[:max_clips]):
            start = float(clip.get("start_time", 0))
            end   = float(clip.get("end_time",   start + clip_duration))

            # Clamp to video duration
            start = max(0, min(start, video_duration - 5))
            end   = min(end, video_duration)
            dur   = end - start
            if dur < 5:
                continue

            clip_id       = str(uuid.uuid4())[:8]
            clip_filename = f"clip_{clip_id}.mp4"
            clip_path     = os.path.join(CLIPS_DIR, clip_filename)

            # Build video filter — 9:16 portrait OR 16:9 landscape
            if aspect_ratio == "9:16":
                # Scale height to 1920 keeping ratio, then center-crop width to 1080
                # Works for ANY input resolution (1080p, 720p, 4K, etc.)
                vf = "scale=-2:1920,crop=1080:1920:(iw-1080)/2:0,setsar=1"
            else:
                # Scale width to 1920 keeping ratio, then center-crop height to 1080
                vf = "scale=1920:-2,crop=1920:1080:0:(ih-1080)/2,setsar=1"

            r = run_ffmpeg([
                "-ss",                str(start),
                "-i",                 tmp_video,
                "-t",                 str(dur),
                "-vf",                vf,
                "-c:v",               "libx264",
                "-c:a",               "aac",
                "-preset",            "fast",
                "-crf",               "23",
                "-movflags",          "+faststart",
                "-avoid_negative_ts", "make_zero",
                "-y",                 clip_path
            ], timeout=300)

            if r.returncode != 0:
                print(f"[Clipping] Clip {i+1} failed: {r.stderr[-100:]}")
                continue

            clip_size = os.path.getsize(clip_path) if os.path.exists(clip_path) else 0
            print(f"[Clipping] Clip {i+1}: {clip_path} ({clip_size} bytes)")

            clips_info.append({
                "id":               clip_id,
                "index":            i + 1,
                "filename":         clip_filename,
                "title":            clip.get("title", f"Clip {i+1}"),
                "reason":           clip.get("reason", ""),
                "hook":             clip.get("hook", ""),
                "engagement_score": int(clip.get("engagement_score", 80)),
                "start_time":       round(start, 1),
                "end_time":         round(end, 1),
                "duration":         round(dur, 1),
                "file_size_mb":     round(clip_size / 1024 / 1024, 2),
                "download_url":     f"/api/clipping/download/{clip_filename}",
            })

        if not clips_info:
            raise HTTPException(status_code=500, detail="Koi clip generate nahi hua")

        print(f"[Clipping] Done! {len(clips_info)} clips ready")

        return {
            "clips":          clips_info,
            "total_clips":    len(clips_info),
            "video_duration": round(video_duration, 1),
            "clip_duration":  clip_duration,
            "full_transcript": full_text[:500],
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Clipping] Error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

    finally:
        for f in [tmp_video, tmp_audio]:
            if f and os.path.exists(f):
                try:
                    os.unlink(f)
                except Exception:
                    pass


@router.get("/download/{filename}")
async def download_clip(filename: str):
    """Serve generated clip file"""
    # Security: only allow clip_ prefix files
    if not filename.startswith("clip_") or ".." in filename:
        raise HTTPException(status_code=403, detail="Invalid filename")

    clip_path = os.path.join(CLIPS_DIR, filename)
    if not os.path.exists(clip_path):
        raise HTTPException(status_code=404, detail="Clip not found — server restart se delete ho gaya")

    return FileResponse(
        clip_path,
        media_type="video/mp4",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── YouTube STATE (same pattern as ClipPulse) ─────────────────────────────
# Stored once after OAuth, reused for all uploads
YOUTUBE_SERVICE = None

def get_youtube_service():
    """Return cached YouTube service or None"""
    return YOUTUBE_SERVICE

def set_youtube_service(service):
    global YOUTUBE_SERVICE
    YOUTUBE_SERVICE = service

def _do_upload(clip_path: str, title: str, description: str, tags: list, privacy: str = "public"):
    """
    Core upload function — same logic as ClipPulse.
    Uses googleapiclient MediaFileUpload with resumable upload.
    """
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError

    youtube = get_youtube_service()
    if not youtube:
        raise Exception("YouTube connected nahi hai — /api/clipping/connect-youtube se connect karo")

    body = {
        "snippet": {
            "title":       title[:100],
            "description": description[:5000],
            "categoryId":  "22",
            "tags":        tags[:15],
        },
        "status": {
            "privacyStatus":           privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(clip_path, mimetype="video/mp4", chunksize=-1, resumable=True)

    print(f"[YT Upload] Uploading: {title[:60]}")
    request = youtube.videos().insert(
        part=",".join(body.keys()),
        body=body,
        media_body=media,
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"[YT Upload] Progress: {int(status.progress() * 100)}%")

    video_id = response.get("id", "")
    print(f"[YT Upload] ✅ Video ID: {video_id}")
    return video_id


@router.get("/youtube-status")
async def youtube_status():
    """Check if YouTube is connected"""
    svc = get_youtube_service()
    return {"connected": svc is not None}


# ── Store flow state between connect and callback ─────────────────────────
_FLOW_STORE = {}  # state -> flow object

def _find_secret():
    import pathlib
    paths = [
        pathlib.Path(__file__).parent.parent.parent / "client_secret.json",
        pathlib.Path(__file__).parent.parent / "client_secret.json",
        pathlib.Path("client_secret.json"),
        pathlib.Path("F:/creator-os/backend/client_secret.json"),
    ]
    for p in paths:
        if p.exists():
            print(f"[YT Connect] Found secret: {p.resolve()}")
            return p
    checked = [str(p.resolve()) for p in paths]
    raise HTTPException(
        status_code=404,
        detail=f"client_secret.json nahi mila! Backend folder mein rakho. Checked: {checked}"
    )

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]

REDIRECT_URI = "http://localhost:8000/api/clipping/oauth-callback"

@router.post("/connect-youtube")
async def connect_youtube():
    """
    Step 1: Generate Google OAuth URL.
    Stores flow in memory so callback can reuse same flow object.
    """
    from google_auth_oauthlib.flow import Flow
    import os

    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    secret_path = _find_secret()

    flow = Flow.from_client_secrets_file(
        str(secret_path),
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
    )

    # Store flow keyed by state — callback will retrieve it
    _FLOW_STORE[state] = flow
    print(f"[YT Connect] Auth URL ready, state={state[:8]}...")
    return {"auth_url": auth_url, "state": state}


@router.get("/oauth-callback")
async def oauth_callback(code: str = None, state: str = "", error: str = None):
    """
    Step 2: Google redirects here with code.
    Reuses the SAME flow object stored in _FLOW_STORE — fixes invalid_grant/code_verifier error.
    """
    from googleapiclient.discovery import build
    from fastapi.responses import RedirectResponse
    import os

    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    if error:
        print(f"[YT Callback] Error from Google: {error}")
        return RedirectResponse(url=f"http://localhost:5173/settings?yt_error={error}")

    if not code:
        return RedirectResponse(url="http://localhost:5173/settings?yt_error=no_code")

    # Retrieve the SAME flow object used to generate auth URL
    flow = _FLOW_STORE.pop(state, None)

    if not flow:
        print(f"[YT Callback] Flow not found for state={state[:8]}... trying fresh flow")
        # Fallback: create fresh flow (works if state not required)
        try:
            from google_auth_oauthlib.flow import Flow
            secret_path = _find_secret()
            flow = Flow.from_client_secrets_file(
                str(secret_path),
                scopes=SCOPES,
                redirect_uri=REDIRECT_URI,
                state=state,
            )
        except Exception as e:
            return RedirectResponse(url=f"http://localhost:5173/settings?yt_error=flow_not_found")

    try:
        # Exchange code for token using the SAME flow
        flow.fetch_token(code=code)
        creds = flow.credentials

        # Build YouTube service — same as ClipPulse STATE["youtube"]
        youtube = build("youtube", "v3", credentials=creds)
        set_youtube_service(youtube)

        print("[YT Callback] ✅ YouTube connected successfully!")
        return RedirectResponse(url="http://localhost:5173/settings?yt_connected=1")

    except Exception as e:
        print(f"[YT Callback] Error: {type(e).__name__}: {e}")
        err_msg = str(e).replace('"', '').replace("'", '')[:120]
        return RedirectResponse(url=f"http://localhost:5173/settings?yt_error={err_msg}")


@router.post("/upload-youtube")
async def upload_to_youtube(
    filename:    str = Form(...),
    title:       str = Form(...),
    description: str = Form(""),
    hashtags:    str = Form("#Shorts"),
    privacy:     str = Form("public"),
):
    """
    Upload clip to YouTube using stored googleapiclient service.
    No access_token needed — uses STATE["youtube"] pattern from ClipPulse.
    """
    if not filename.startswith("clip_") or ".." in filename:
        raise HTTPException(status_code=403, detail="Invalid filename")

    clip_path = os.path.join(CLIPS_DIR, filename)
    if not os.path.exists(clip_path):
        raise HTTPException(status_code=404, detail="Clip not found — regenerate karo")

    if not get_youtube_service():
        raise HTTPException(
            status_code=401,
            detail="YouTube connected nahi — Auto Clip page se YouTube Connect button dabao"
        )

    tags = [t.lstrip("#").strip() for t in hashtags.split() if t.strip()]
    full_desc = description.strip() + (f"\n\n{hashtags.strip()}" if hashtags.strip() else "")

    try:
        import asyncio
        loop = asyncio.get_event_loop()
        video_id = await loop.run_in_executor(
            None,
            lambda: _do_upload(clip_path, title, full_desc, tags, privacy)
        )
        return {
            "success":   True,
            "video_id":  video_id,
            "video_url": f"https://youtube.com/shorts/{video_id}",
            "title":     title,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[YT Upload] Error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# backend/app/api/clipping.py
# Auto Clip Generator for Nexora OS
# YouTube OAuth moved to youtube.py — this file handles clip detection + upload only
# NO client_secret.json — pure environment variables

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from fastapi.responses import FileResponse
import os
import tempfile
import subprocess
import json
import uuid
from groq import Groq

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

CLIPS_DIR = tempfile.gettempdir()

# ── Env ───────────────────────────────────────────────────────────────────────
APP_ENV      = os.getenv("APP_ENV", "production")
IS_LOCAL     = APP_ENV == "local"
FRONTEND_URL = "http://localhost:5173" if IS_LOCAL else "https://creator-os-ochre.vercel.app"
BACKEND_URL  = "http://localhost:8000" if IS_LOCAL else "https://creator-os-production-0bf8.up.railway.app"

CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]

# ── In-memory YouTube service store (legacy — new auth via youtube.py) ────────
_YT_SERVICES: dict = {}
_FLOW_STORE:  dict = {}


def get_youtube_service_for_user(user_id: str):
    """
    First try new youtube_connections table via Supabase.
    Fallback to in-memory store for backwards compatibility.
    """
    # Try new system first
    try:
        from supabase import create_client
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build

        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
        r  = sb.table("youtube_connections") \
               .select("access_token, refresh_token") \
               .eq("user_id", user_id) \
               .maybe_single().execute()

        if r.data and r.data.get("access_token"):
            creds = Credentials(
                token         = r.data["access_token"],
                refresh_token = r.data.get("refresh_token"),
                token_uri     = "https://oauth2.googleapis.com/token",
                client_id     = CLIENT_ID,
                client_secret = CLIENT_SECRET,
                scopes        = SCOPES,
            )
            return build("youtube", "v3", credentials=creds)
    except Exception:
        pass

    # Fallback: in-memory
    svc = _YT_SERVICES.get(user_id)
    if svc:
        return svc

    raise Exception(f"YouTube not connected for user {user_id}. Please connect in Settings.")


def set_youtube_service_for_user(user_id: str, service):
    _YT_SERVICES[user_id] = service


def get_youtube_service():
    """Legacy fallback — returns any stored service."""
    if _YT_SERVICES:
        return next(iter(_YT_SERVICES.values()))
    return None


def set_youtube_service(service):
    _YT_SERVICES["__global__"] = service


# ── Helpers ───────────────────────────────────────────────────────────────────
def get_val(obj, key, default=None):
    return obj.get(key, default) if isinstance(obj, dict) else getattr(obj, key, default)


def run_ffmpeg(args: list, timeout: int = 300):
    return subprocess.run(
        ["ffmpeg"] + args,
        capture_output=True, text=True, timeout=timeout
    )


def get_video_duration(path: str) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", path],
        capture_output=True, text=True
    )
    try:
        return float(json.loads(r.stdout)["format"]["duration"])
    except Exception:
        return 0.0


def _get_supabase_user(token: str):
    from supabase import create_client
    sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    return sb.auth.get_user(token)


def _get_client_config():
    """Build OAuth client config from env vars — no JSON file needed."""
    return {
        "web": {
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
            "token_uri":     "https://oauth2.googleapis.com/token",
            "redirect_uris": [
                "http://localhost:8000/api/clipping/oauth-callback",
                "https://creator-os-production-0bf8.up.railway.app/api/clipping/oauth-callback",
            ],
        }
    }


REDIRECT_URI = f"{BACKEND_URL}/api/clipping/oauth-callback"


# ── YouTube Status ────────────────────────────────────────────────────────────
@router.get("/youtube-status")
async def youtube_status(authorization: str = Header(None)):
    """Check if YouTube is connected — checks both new and legacy systems."""
    if authorization and authorization.startswith("Bearer "):
        try:
            token   = authorization.split(" ")[1]
            user    = _get_supabase_user(token)
            uid     = user.user.id

            # Check new youtube_connections table
            from supabase import create_client
            sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
            r  = sb.table("youtube_connections") \
                   .select("channel_name") \
                   .eq("user_id", uid) \
                   .maybe_single().execute()

            if r.data:
                return {"connected": True, "source": "youtube_connections"}

            # Fallback: in-memory
            return {"connected": uid in _YT_SERVICES or "__global__" in _YT_SERVICES}
        except Exception:
            pass

    return {"connected": get_youtube_service() is not None}


# ── Connect YouTube (Legacy — kept for backwards compat) ─────────────────────
@router.post("/connect-youtube")
async def connect_youtube(authorization: str = Header(None)):
    """
    Legacy YouTube connect endpoint.
    New system: use /api/youtube/auth?user_id=UUID instead.
    This is kept so old frontend code doesn't break.
    """
    from google_auth_oauthlib.flow import Flow

    if IS_LOCAL:
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    # Use env vars — no client_secret.json file
    flow = Flow.from_client_config(
        _get_client_config(),
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

    auth_url, state = flow.authorization_url(access_type="offline", prompt="consent")

    user_id = "__global__"
    if authorization and authorization.startswith("Bearer "):
        try:
            user    = _get_supabase_user(authorization.split(" ")[1])
            user_id = user.user.id
        except Exception:
            pass

    _FLOW_STORE[state] = {"flow": flow, "user_id": user_id}
    return {"auth_url": auth_url, "state": state}


# ── OAuth Callback (Legacy) ───────────────────────────────────────────────────
@router.get("/oauth-callback")
async def oauth_callback(code: str = None, state: str = "", error: str = None):
    """Legacy OAuth callback — kept for backwards compatibility."""
    from googleapiclient.discovery import build
    from fastapi.responses import RedirectResponse

    if IS_LOCAL:
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?yt_error={error}")
    if not code:
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?yt_error=no_code")

    stored  = _FLOW_STORE.pop(state, None)
    user_id = "__global__"

    if stored:
        flow    = stored["flow"]
        user_id = stored.get("user_id", "__global__")
    else:
        try:
            from google_auth_oauthlib.flow import Flow
            flow = Flow.from_client_config(
                _get_client_config(),
                scopes=SCOPES,
                redirect_uri=REDIRECT_URI,
                state=state
            )
        except Exception:
            return RedirectResponse(url=f"{FRONTEND_URL}/settings?yt_error=flow_not_found")

    try:
        flow.fetch_token(code=code)
        youtube = build("youtube", "v3", credentials=flow.credentials)
        set_youtube_service_for_user(user_id, youtube)
        set_youtube_service(youtube)
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?yt_connected=1")
    except Exception as e:
        err = str(e)[:120].replace('"', '').replace("'", '')
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?yt_error={err}")


# ── Detect Clips ──────────────────────────────────────────────────────────────
@router.post("/detect-clips")
async def detect_clips(
    file:          UploadFile = File(...),
    clip_duration: int  = Form(60),
    max_clips:     int  = Form(5),
    aspect_ratio:  str  = Form("9:16"),
):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Video file zaroori hai")

    suffix     = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    tmp_video  = None
    tmp_audio  = None
    clips_info = []

    try:
        # 1. Save video
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
            content   = await file.read()
            f.write(content)
            tmp_video = f.name

        video_duration = get_video_duration(tmp_video)

        if video_duration < clip_duration:
            raise HTTPException(
                status_code=400,
                detail=f"Video ({video_duration:.0f}s) clip duration ({clip_duration}s) se choti hai"
            )

        # 2. Extract audio
        tmp_audio = tmp_video.replace(suffix, "_audio.mp3")
        r = run_ffmpeg([
            "-i", tmp_video, "-vn", "-acodec", "libmp3lame",
            "-ar", "16000", "-ac", "1", "-ab", "64k", "-y", tmp_audio
        ])
        if r.returncode != 0:
            raise HTTPException(500, f"Audio extract failed: {r.stderr[-200:]}")

        # 3. Whisper transcription
        with open(tmp_audio, "rb") as af:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(tmp_audio), af, "audio/mp3"),
                model="whisper-large-v3",
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        segments_raw = (
            transcription.get("segments", []) if isinstance(transcription, dict)
            else getattr(transcription, "segments", []) or []
        )
        full_text = (
            transcription.get("text", "") if isinstance(transcription, dict)
            else getattr(transcription, "text", "") or ""
        )

        transcript_lines = []
        for seg in segments_raw:
            start = float(get_val(seg, "start") or 0)
            end   = float(get_val(seg, "end")   or 0)
            text  = (get_val(seg, "text") or "").strip()
            if text:
                transcript_lines.append(f"[{start:.1f}s - {end:.1f}s] {text}")

        transcript_for_ai = "\n".join(transcript_lines[:150])

        # 4. Groq AI — find best moments
        ai_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "user",
                "content": f"""You are a viral content expert. Find {max_clips} best moments.
Video duration: {video_duration:.0f}s, Clip length: {clip_duration}s each.
Transcript:\n{transcript_for_ai}
Return ONLY JSON: {{"clips":[{{"start_time":0,"end_time":{clip_duration},"title":"","reason":"","hook":"","engagement_score":90}}]}}"""
            }],
            max_tokens=1500,
            temperature=0.3,
        )
        ai_text = ai_response.choices[0].message.content.strip()

        try:
            ai_data         = json.loads(ai_text[ai_text.find("{"):ai_text.rfind("}")+1])
            suggested_clips = ai_data.get("clips", [])
        except Exception:
            suggested_clips = []
            step = (video_duration - clip_duration) / max(max_clips, 1)
            for i in range(min(max_clips, int(video_duration // clip_duration))):
                st = round(i * step, 1)
                suggested_clips.append({
                    "start_time": st, "end_time": round(st + clip_duration, 1),
                    "title": f"Clip {i+1}", "reason": "Auto", "hook": "",
                    "engagement_score": 80 - i * 5
                })

        # 5. Cut clips with ffmpeg
        for i, clip in enumerate(suggested_clips[:max_clips]):
            start = max(0, min(float(clip.get("start_time", 0)), video_duration - 5))
            end   = min(float(clip.get("end_time", start + clip_duration)), video_duration)
            dur   = end - start
            if dur < 5:
                continue

            clip_id       = str(uuid.uuid4())[:8]
            clip_filename = f"clip_{clip_id}.mp4"
            clip_path     = os.path.join(CLIPS_DIR, clip_filename)

            vf = (
                "scale=-2:1920,crop=1080:1920:(iw-1080)/2:0,setsar=1"
                if aspect_ratio == "9:16"
                else "scale=1920:-2,crop=1920:1080:0:(ih-1080)/2,setsar=1"
            )

            r = run_ffmpeg([
                "-ss", str(start), "-i", tmp_video, "-t", str(dur),
                "-vf", vf, "-c:v", "libx264", "-c:a", "aac",
                "-preset", "fast", "-crf", "23", "-movflags", "+faststart",
                "-avoid_negative_ts", "make_zero", "-y", clip_path
            ], timeout=300)

            if r.returncode != 0:
                continue

            clip_size = os.path.getsize(clip_path) if os.path.exists(clip_path) else 0
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
            raise HTTPException(500, "Koi clip generate nahi hua")

        return {
            "clips":            clips_info,
            "total_clips":      len(clips_info),
            "video_duration":   round(video_duration, 1),
            "clip_duration":    clip_duration,
            "full_transcript":  full_text[:500],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"{type(e).__name__}: {str(e)}")
    finally:
        for f in [tmp_video, tmp_audio]:
            if f and os.path.exists(f):
                try:
                    os.unlink(f)
                except Exception:
                    pass


# ── Download Clip ─────────────────────────────────────────────────────────────
@router.get("/download/{filename}")
async def download_clip(filename: str):
    if not filename.startswith("clip_") or ".." in filename:
        raise HTTPException(403, "Invalid filename")
    clip_path = os.path.join(CLIPS_DIR, filename)
    if not os.path.exists(clip_path):
        raise HTTPException(404, "Clip not found — server restart se delete ho gaya")
    return FileResponse(
        clip_path,
        media_type="video/mp4",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ── Upload Clip to YouTube ────────────────────────────────────────────────────
def _do_upload(clip_path, title, description, tags, privacy, user_id=None):
    from googleapiclient.http import MediaFileUpload

    youtube = (
        _YT_SERVICES.get(user_id) if user_id else None
    ) or get_youtube_service()

    if not youtube:
        raise Exception("YouTube connected nahi — Settings se connect karo")

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

    media   = MediaFileUpload(clip_path, mimetype="video/mp4", chunksize=-1, resumable=True)
    request = youtube.videos().insert(
        part=",".join(body.keys()),
        body=body,
        media_body=media
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"[YT Upload] {int(status.progress()*100)}%")

    return response.get("id", "")


@router.post("/upload-youtube")
async def upload_to_youtube(
    filename:      str = Form(...),
    title:         str = Form(...),
    description:   str = Form(""),
    hashtags:      str = Form("#Shorts"),
    privacy:       str = Form("public"),
    authorization: str = Header(None),
):
    if not filename.startswith("clip_") or ".." in filename:
        raise HTTPException(403, "Invalid filename")

    clip_path = os.path.join(CLIPS_DIR, filename)
    if not os.path.exists(clip_path):
        raise HTTPException(404, "Clip not found")

    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            user    = _get_supabase_user(authorization.split(" ")[1])
            user_id = user.user.id
        except Exception:
            pass

    tags      = [t.lstrip("#").strip() for t in hashtags.split() if t.strip()]
    full_desc = description.strip() + (f"\n\n{hashtags.strip()}" if hashtags.strip() else "")

    try:
        import asyncio
        video_id = await asyncio.get_event_loop().run_in_executor(
            None, lambda: _do_upload(clip_path, title, full_desc, tags, privacy, user_id)
        )
        return {
            "success":   True,
            "video_id":  video_id,
            "video_url": f"https://youtube.com/shorts/{video_id}",
            "title":     title,
        }
    except Exception as e:
        raise HTTPException(500, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# VIDEO EDITOR ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

import asyncio

@router.post("/editor/upload")
async def editor_upload(file: UploadFile = File(...)):
    """Upload video to server for editing. Returns file_id + duration + metadata."""
    suffix   = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    file_id  = str(uuid.uuid4())
    tmp_path = os.path.join(CLIPS_DIR, f"editor_{file_id}{suffix}")

    content  = await file.read()
    with open(tmp_path, "wb") as f:
        f.write(content)

    duration = get_video_duration(tmp_path)

    # Get video info via ffprobe
    probe_r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", tmp_path],
        capture_output=True, text=True
    )
    width = height = 0
    try:
        streams = json.loads(probe_r.stdout).get("streams", [])
        for s in streams:
            if s.get("codec_type") == "video":
                width  = s.get("width", 0)
                height = s.get("height", 0)
                break
    except Exception:
        pass

    return {
        "file_id":  file_id,
        "filename": os.path.basename(tmp_path),
        "duration": round(duration, 2),
        "width":    width,
        "height":   height,
        "size_mb":  round(len(content) / 1024 / 1024, 2),
        "path":     tmp_path,
    }


@router.post("/editor/trim")
async def editor_trim(
    file_id:    str   = Form(...),
    start_time: float = Form(...),   # seconds
    end_time:   float = Form(...),   # seconds
    output_format: str = Form("mp4"),
):
    """Trim video from start_time to end_time."""
    # Find the uploaded file
    pattern = os.path.join(CLIPS_DIR, f"editor_{file_id}*")
    import glob
    matches = glob.glob(pattern)
    if not matches:
        raise HTTPException(404, "File not found. Please upload again.")

    input_path  = matches[0]
    output_id   = str(uuid.uuid4())
    output_path = os.path.join(CLIPS_DIR, f"trimmed_{output_id}.{output_format}")

    duration = end_time - start_time
    if duration <= 0:
        raise HTTPException(400, "End time must be after start time.")

    try:
        result = await asyncio.get_event_loop().run_in_executor(None, lambda: subprocess.run(
            [
                "ffmpeg", "-y",
                "-ss", str(start_time),
                "-i", input_path,
                "-t", str(duration),
                "-c:v", "libx264", "-crf", "23",
                "-c:a", "aac",
                "-movflags", "+faststart",
                output_path
            ],
            capture_output=True, text=True, timeout=300
        ))
        if not os.path.exists(output_path):
            raise HTTPException(500, f"FFmpeg failed: {result.stderr[-300:]}")
    except Exception as e:
        raise HTTPException(500, f"Trim failed: {str(e)}")

    size_mb = round(os.path.getsize(output_path) / 1024 / 1024, 2)
    return {
        "success":      True,
        "output_id":    output_id,
        "download_url": f"/api/clipping/editor/download/{output_id}",
        "duration":     duration,
        "size_mb":      size_mb,
    }


@router.post("/editor/cut")
async def editor_cut(
    file_id:    str   = Form(...),
    cuts:       str   = Form(...),   # JSON: [{"start": 0, "end": 10}, {"start": 20, "end": 35}]
    output_format: str = Form("mp4"),
):
    """
    Cut and join multiple segments from a video.
    cuts: JSON array of {start, end} objects in seconds.
    """
    import glob
    pattern = os.path.join(CLIPS_DIR, f"editor_{file_id}*")
    matches = glob.glob(pattern)
    if not matches:
        raise HTTPException(404, "File not found. Please upload again.")

    input_path = matches[0]
    try:
        segments = json.loads(cuts)
    except Exception:
        raise HTTPException(400, "Invalid cuts format. Expected JSON array.")

    if not segments:
        raise HTTPException(400, "No segments provided.")

    output_id    = str(uuid.uuid4())
    output_path  = os.path.join(CLIPS_DIR, f"cut_{output_id}.{output_format}")

    # Build ffmpeg filter_complex for joining segments
    filter_parts = []
    for i, seg in enumerate(segments):
        s, e = seg["start"], seg["end"]
        filter_parts.append(f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{i}];")
        filter_parts.append(f"[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS[a{i}];")

    n = len(segments)
    concat_v = "".join(f"[v{i}]" for i in range(n))
    concat_a = "".join(f"[a{i}]" for i in range(n))
    filter_complex = "".join(filter_parts) + f"{concat_v}concat=n={n}:v=1:a=0[vout];{concat_a}concat=n={n}:v=0:a=1[aout]"

    try:
        result = await asyncio.get_event_loop().run_in_executor(None, lambda: subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-filter_complex", filter_complex,
                "-map", "[vout]", "-map", "[aout]",
                "-c:v", "libx264", "-crf", "23",
                "-c:a", "aac",
                "-movflags", "+faststart",
                output_path
            ],
            capture_output=True, text=True, timeout=600
        ))
        if not os.path.exists(output_path):
            raise HTTPException(500, f"FFmpeg cut failed: {result.stderr[-300:]}")
    except Exception as e:
        raise HTTPException(500, f"Cut failed: {str(e)}")

    size_mb  = round(os.path.getsize(output_path) / 1024 / 1024, 2)
    duration = get_video_duration(output_path)
    return {
        "success":      True,
        "output_id":    output_id,
        "download_url": f"/api/clipping/editor/download/{output_id}",
        "duration":     round(duration, 2),
        "size_mb":      size_mb,
        "segments":     len(segments),
    }


@router.get("/editor/download/{output_id}")
async def editor_download(output_id: str):
    """Download edited/trimmed video."""
    import glob
    for pattern in [f"trimmed_{output_id}.*", f"cut_{output_id}.*"]:
        matches = glob.glob(os.path.join(CLIPS_DIR, pattern))
        if matches:
            path = matches[0]
            filename = os.path.basename(path)
            return FileResponse(
                path,
                media_type="video/mp4",
                filename=f"nexora_edit_{output_id[:8]}.mp4",
                headers={"Content-Disposition": f"attachment; filename=nexora_edit_{output_id[:8]}.mp4"}
            )
    raise HTTPException(404, "File not found or expired.")
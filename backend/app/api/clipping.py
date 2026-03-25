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

# ── Per-user YouTube service store ───────────────────────────────────────────
_YT_SERVICES: dict = {}   # user_id → youtube service
_FLOW_STORE:  dict = {}   # state   → {flow, user_id}


def get_youtube_service_for_user(user_id: str):
    svc = _YT_SERVICES.get(user_id)
    if not svc:
        raise Exception(f"YouTube not connected for user {user_id}. Please connect in Settings.")
    return svc


def set_youtube_service_for_user(user_id: str, service):
    _YT_SERVICES[user_id] = service
    print(f"[YT] Service stored for user {user_id[:8]}...")


def get_youtube_service():
    """Return any stored service — used by social.py fallback."""
    if _YT_SERVICES:
        return next(iter(_YT_SERVICES.values()))
    return None


def set_youtube_service(service):
    _YT_SERVICES["__global__"] = service


# ── Helpers ───────────────────────────────────────────────────────────────────
def get_val(obj, key, default=None):
    return obj.get(key, default) if isinstance(obj, dict) else getattr(obj, key, default)


def run_ffmpeg(args: list, timeout: int = 300):
    return subprocess.run(["ffmpeg"] + args, capture_output=True, text=True, timeout=timeout)


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
            return p
    raise HTTPException(
        status_code=404,
        detail=f"client_secret.json nahi mila! Checked: {[str(p.resolve()) for p in paths]}"
    )


SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]
REDIRECT_URI = "http://localhost:8000/api/clipping/oauth-callback"


# ── YouTube Status ────────────────────────────────────────────────────────────
@router.get("/youtube-status")
async def youtube_status(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return {"connected": get_youtube_service() is not None}
    try:
        token = authorization.split(" ")[1]
        user  = _get_supabase_user(token)
        uid   = user.user.id
        return {"connected": uid in _YT_SERVICES or "__global__" in _YT_SERVICES}
    except Exception:
        return {"connected": get_youtube_service() is not None}


# ── Connect YouTube (Step 1) ──────────────────────────────────────────────────
@router.post("/connect-youtube")
async def connect_youtube(authorization: str = Header(None)):
    from google_auth_oauthlib.flow import Flow
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    secret_path = _find_secret()
    flow = Flow.from_client_secrets_file(str(secret_path), scopes=SCOPES, redirect_uri=REDIRECT_URI)
    auth_url, state = flow.authorization_url(access_type="offline", prompt="consent")

    user_id = "__global__"
    if authorization and authorization.startswith("Bearer "):
        try:
            user    = _get_supabase_user(authorization.split(" ")[1])
            user_id = user.user.id
        except Exception:
            pass

    _FLOW_STORE[state] = {"flow": flow, "user_id": user_id}
    print(f"[YT Connect] state={state[:8]}... user={user_id[:8]}...")
    return {"auth_url": auth_url, "state": state}


# ── OAuth Callback (Step 2) ───────────────────────────────────────────────────
@router.get("/oauth-callback")
async def oauth_callback(code: str = None, state: str = "", error: str = None):
    from googleapiclient.discovery import build
    from fastapi.responses import RedirectResponse
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    if error:
        return RedirectResponse(url=f"http://localhost:5173/settings?yt_error={error}")
    if not code:
        return RedirectResponse(url="http://localhost:5173/settings?yt_error=no_code")

    stored  = _FLOW_STORE.pop(state, None)
    user_id = "__global__"

    if stored:
        flow    = stored["flow"]
        user_id = stored.get("user_id", "__global__")
    else:
        try:
            from google_auth_oauthlib.flow import Flow
            secret_path = _find_secret()
            flow = Flow.from_client_secrets_file(
                str(secret_path), scopes=SCOPES,
                redirect_uri=REDIRECT_URI, state=state
            )
        except Exception:
            return RedirectResponse(url="http://localhost:5173/settings?yt_error=flow_not_found")

    try:
        flow.fetch_token(code=code)
        youtube = build("youtube", "v3", credentials=flow.credentials)
        set_youtube_service_for_user(user_id, youtube)
        set_youtube_service(youtube)   # legacy fallback
        print(f"[YT Callback] ✅ Connected user={user_id[:8]}...")
        return RedirectResponse(url="http://localhost:5173/settings?yt_connected=1")
    except Exception as e:
        err = str(e).replace('"', '').replace("'", '')[:120]
        return RedirectResponse(url=f"http://localhost:5173/settings?yt_error={err}")


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

    suffix    = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    tmp_video = None
    tmp_audio = None
    clips_info = []

    try:
        # 1. Save video
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
            content = await file.read()
            f.write(content)
            tmp_video = f.name

        video_duration = get_video_duration(tmp_video)
        print(f"[Clipping] Duration: {video_duration:.1f}s")

        if video_duration < clip_duration:
            raise HTTPException(
                status_code=400,
                detail=f"Video ({video_duration:.0f}s) clip duration ({clip_duration}s) se choti hai"
            )

        # 2. Extract audio
        tmp_audio = tmp_video.replace(suffix, "_audio.mp3")
        r = run_ffmpeg(["-i", tmp_video, "-vn", "-acodec", "libmp3lame",
                        "-ar", "16000", "-ac", "1", "-ab", "64k", "-y", tmp_audio])
        if r.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Audio extract failed: {r.stderr[-200:]}")

        # 3. Whisper transcription
        print("[Clipping] Transcribing...")
        with open(tmp_audio, "rb") as af:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(tmp_audio), af, "audio/mp3"),
                model="whisper-large-v3",
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        segments_raw = (transcription.get("segments", []) if isinstance(transcription, dict)
                        else getattr(transcription, "segments", []) or [])
        full_text    = (transcription.get("text", "") if isinstance(transcription, dict)
                        else getattr(transcription, "text", "") or "")

        transcript_lines = []
        for seg in segments_raw:
            start = float(get_val(seg, "start") or 0)
            end   = float(get_val(seg, "end")   or 0)
            text  = (get_val(seg, "text") or "").strip()
            if text:
                transcript_lines.append(f"[{start:.1f}s - {end:.1f}s] {text}")

        transcript_for_ai = "\n".join(transcript_lines[:150])

        # 4. Groq AI
        print("[Clipping] Groq AI best moments...")
        ai_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": f"""You are a viral content expert. Find {max_clips} best moments.
Video duration: {video_duration:.0f}s, Clip length: {clip_duration}s each.
Transcript:\n{transcript_for_ai}
Return ONLY JSON: {{"clips":[{{"start_time":0,"end_time":{clip_duration},"title":"","reason":"","hook":"","engagement_score":90}}]}}"""}],
            max_tokens=1500, temperature=0.3,
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
                suggested_clips.append({"start_time": st, "end_time": round(st+clip_duration,1),
                                         "title": f"Clip {i+1}", "reason": "Auto", "hook": "", "engagement_score": 80-i*5})

        # 5. Cut clips
        for i, clip in enumerate(suggested_clips[:max_clips]):
            start = max(0, min(float(clip.get("start_time", 0)), video_duration - 5))
            end   = min(float(clip.get("end_time", start + clip_duration)), video_duration)
            dur   = end - start
            if dur < 5:
                continue

            clip_id       = str(uuid.uuid4())[:8]
            clip_filename = f"clip_{clip_id}.mp4"
            clip_path     = os.path.join(CLIPS_DIR, clip_filename)
            vf = ("scale=-2:1920,crop=1080:1920:(iw-1080)/2:0,setsar=1" if aspect_ratio == "9:16"
                  else "scale=1920:-2,crop=1920:1080:0:(ih-1080)/2,setsar=1")

            r = run_ffmpeg(["-ss", str(start), "-i", tmp_video, "-t", str(dur),
                            "-vf", vf, "-c:v", "libx264", "-c:a", "aac",
                            "-preset", "fast", "-crf", "23", "-movflags", "+faststart",
                            "-avoid_negative_ts", "make_zero", "-y", clip_path], timeout=300)

            if r.returncode != 0:
                print(f"[Clipping] Clip {i+1} failed: {r.stderr[-100:]}")
                continue

            clip_size = os.path.getsize(clip_path) if os.path.exists(clip_path) else 0
            clips_info.append({
                "id": clip_id, "index": i+1, "filename": clip_filename,
                "title": clip.get("title", f"Clip {i+1}"),
                "reason": clip.get("reason", ""), "hook": clip.get("hook", ""),
                "engagement_score": int(clip.get("engagement_score", 80)),
                "start_time": round(start, 1), "end_time": round(end, 1),
                "duration": round(dur, 1),
                "file_size_mb": round(clip_size/1024/1024, 2),
                "download_url": f"/api/clipping/download/{clip_filename}",
            })

        if not clips_info:
            raise HTTPException(status_code=500, detail="Koi clip generate nahi hua")

        return {"clips": clips_info, "total_clips": len(clips_info),
                "video_duration": round(video_duration, 1), "clip_duration": clip_duration,
                "full_transcript": full_text[:500]}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")
    finally:
        for f in [tmp_video, tmp_audio]:
            if f and os.path.exists(f):
                try: os.unlink(f)
                except Exception: pass


# ── Download Clip ─────────────────────────────────────────────────────────────
@router.get("/download/{filename}")
async def download_clip(filename: str):
    if not filename.startswith("clip_") or ".." in filename:
        raise HTTPException(status_code=403, detail="Invalid filename")
    clip_path = os.path.join(CLIPS_DIR, filename)
    if not os.path.exists(clip_path):
        raise HTTPException(status_code=404, detail="Clip not found — server restart se delete ho gaya")
    return FileResponse(clip_path, media_type="video/mp4", filename=filename,
                        headers={"Content-Disposition": f"attachment; filename={filename}"})


# ── Upload to YouTube ─────────────────────────────────────────────────────────
def _do_upload(clip_path, title, description, tags, privacy, user_id=None):
    from googleapiclient.http import MediaFileUpload
    youtube = (_YT_SERVICES.get(user_id) if user_id else None) or get_youtube_service()
    if not youtube:
        raise Exception("YouTube connected nahi — Settings se connect karo")

    body = {
        "snippet": {"title": title[:100], "description": description[:5000],
                    "categoryId": "22", "tags": tags[:15]},
        "status":  {"privacyStatus": privacy, "selfDeclaredMadeForKids": False},
    }
    media   = MediaFileUpload(clip_path, mimetype="video/mp4", chunksize=-1, resumable=True)
    request = youtube.videos().insert(part=",".join(body.keys()), body=body, media_body=media)
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status: print(f"[YT Upload] {int(status.progress()*100)}%")
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
        raise HTTPException(status_code=403, detail="Invalid filename")
    clip_path = os.path.join(CLIPS_DIR, filename)
    if not os.path.exists(clip_path):
        raise HTTPException(status_code=404, detail="Clip not found")
    if not get_youtube_service():
        raise HTTPException(status_code=401, detail="YouTube connected nahi — Settings se connect karo")

    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            user    = _get_supabase_user(authorization.split(" ")[1])
            user_id = user.user.id
        except Exception: pass

    tags      = [t.lstrip("#").strip() for t in hashtags.split() if t.strip()]
    full_desc = description.strip() + (f"\n\n{hashtags.strip()}" if hashtags.strip() else "")

    try:
        import asyncio
        video_id = await asyncio.get_event_loop().run_in_executor(
            None, lambda: _do_upload(clip_path, title, full_desc, tags, privacy, user_id)
        )
        return {"success": True, "video_id": video_id,
                "video_url": f"https://youtube.com/shorts/{video_id}", "title": title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
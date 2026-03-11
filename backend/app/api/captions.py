from fastapi import APIRouter, HTTPException, UploadFile, File
import os
import tempfile
import subprocess
from groq import Groq

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def get_val(obj, key):
    """Dict ya object dono se value lo"""
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)


@router.post("/auto-caption")
async def auto_caption(file: UploadFile = File(...)):

    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Video file zaroori hai (mp4, mov, avi, webm)")

    tmp_video = None
    tmp_audio = None

    try:
        # ── 1. Save video to temp file ──────────────────────────
        suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_video = tmp.name

        print(f"[Captions] Video saved: {tmp_video}, size: {len(content)} bytes")

        if len(content) < 1000:
            raise HTTPException(status_code=400, detail="File bohot choti hai ya corrupt hai")

        # ── 2. Extract audio with ffmpeg ────────────────────────
        tmp_audio = tmp_video.replace(suffix, ".mp3")

        result = subprocess.run([
            "ffmpeg",
            "-i", tmp_video,
            "-vn",                   # no video
            "-acodec", "libmp3lame", # mp3 codec
            "-ar", "16000",          # 16kHz — whisper ke liye ideal
            "-ac", "1",              # mono
            "-ab", "64k",            # low bitrate = smaller file
            "-y",                    # overwrite
            tmp_audio
        ], capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            print(f"[Captions] FFmpeg stderr: {result.stderr}")
            raise HTTPException(
                status_code=500,
                detail=f"Audio extract failed. FFmpeg error: {result.stderr[-300:]}"
            )

        audio_size = os.path.getsize(tmp_audio)
        print(f"[Captions] Audio extracted: {tmp_audio}, size: {audio_size} bytes")

        if audio_size < 500:
            raise HTTPException(
                status_code=400,
                detail="Audio extract nahi hua — video mein audio track hai?"
            )

        # ── 3. Groq Whisper transcription ───────────────────────
        print(f"[Captions] Sending to Groq Whisper...")

        with open(tmp_audio, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(tmp_audio), audio_file, "audio/mp3"),
                model="whisper-large-v3",
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        print(f"[Captions] Groq response type: {type(transcription)}")

        # ── 4. Extract segments safely (dict or object) ─────────
        # Groq kabhi dict return karta hai, kabhi object — dono handle karo
        if isinstance(transcription, dict):
            segments_raw = transcription.get("segments", [])
            full_text    = transcription.get("text", "")
        else:
            segments_raw = getattr(transcription, "segments", []) or []
            full_text    = getattr(transcription, "text", "")

        print(f"[Captions] Segments found: {len(segments_raw)}")

        if not segments_raw:
            raise HTTPException(
                status_code=422,
                detail="Transcription empty — video mein speech nahi mili ya audio inaudible hai"
            )

        # ── 5. Convert segments → captions ─────────────────────
        captions = []

        for seg in segments_raw:
            # Safe access — dict ya object dono
            text  = (get_val(seg, "text")  or "").strip()
            start = get_val(seg, "start")  or 0.0
            end   = get_val(seg, "end")    or 0.0

            if not text:
                continue

            # Long segments ko 6-word chunks mein split karo
            words = text.split()
            if len(words) <= 8:
                captions.append({
                    "text":  text,
                    "start": round(float(start), 2),
                    "end":   round(float(end),   2),
                })
            else:
                seg_dur    = float(end) - float(start)
                chunks     = [words[i:i + 6] for i in range(0, len(words), 6)]
                chunk_dur  = seg_dur / len(chunks) if chunks else seg_dur
                for j, chunk in enumerate(chunks):
                    captions.append({
                        "text":  " ".join(chunk),
                        "start": round(float(start) + j * chunk_dur,       2),
                        "end":   round(float(start) + (j + 1) * chunk_dur, 2),
                    })

        if not captions:
            raise HTTPException(
                status_code=422,
                detail="Captions generate nahi hue — transcription empty tha"
            )

        # Last segment ka end time
        last_seg  = segments_raw[-1]
        last_end  = get_val(last_seg, "end") or 0.0

        print(f"[Captions] Done! Total captions: {len(captions)}")

        return {
            "captions":       captions,
            "full_text":      full_text,
            "total_segments": len(captions),
            "duration":       round(float(last_end), 2),
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"[Captions] Unexpected error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

    finally:
        # Cleanup temp files
        for f in [tmp_video, tmp_audio]:
            if f and os.path.exists(f):
                try:
                    os.unlink(f)
                except Exception:
                    pass
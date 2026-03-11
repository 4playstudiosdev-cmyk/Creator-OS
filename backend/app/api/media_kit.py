import os
from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()

@router.get("/{username}")
async def get_media_kit(username: str):
    """Public media kit fetch karna by username"""
    try:
        response = supabase.table("profiles")\
            .select("*")\
            .eq("username", username)\
            .eq("is_public", True)\
            .single()\
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Profile nahi mili!")

        return response.data

    except Exception as e:
        raise HTTPException(status_code=404, detail="Profile nahi mili!")


@router.post("/setup")
async def setup_profile(profile: dict):
    """Nayi profile create karna"""
    try:
        response = supabase.table("profiles")\
            .upsert(profile)\
            .execute()
        return {"message": "Profile save ho gayi!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/update")
async def update_profile(profile: dict):
    """Profile update karna"""
    try:
        user_id = profile.get("id")
        response = supabase.table("profiles")\
            .update(profile)\
            .eq("id", user_id)\
            .execute()
        return {"message": "Profile updated!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
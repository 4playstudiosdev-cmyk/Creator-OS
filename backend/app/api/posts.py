import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Header

# Environment variables load karna (.env file se)
load_dotenv()

# Supabase Client setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Supabase URL ya Key missing hai .env file mein!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Router initialize karna
router = APIRouter()

# --- Pydantic Models (Data Validation ke liye) ---
class PostCreate(BaseModel):
    user_id: str
    content: str
    platforms: List[str]  # e.g., ["twitter", "linkedin"]
    scheduled_for: datetime

class PostReschedule(BaseModel):
    scheduled_for: datetime

# --- API Endpoints ---

@router.post("/create")
async def create_post(post: PostCreate):
    """Nayi post ko Supabase mein save karne ke liye"""
    try:
        data = {
            "user_id": post.user_id,
            "content": post.content,
            "platforms": post.platforms,
            "scheduled_for": post.scheduled_for.isoformat(),
            "status": "scheduled"
        }
        # Supabase database mein insert karna
        response = supabase.table("scheduled_posts").insert(data).execute()
        return {"message": "Post successfully schedule ho gayi!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/{user_id}")
async def get_user_posts(user_id: str):
    """User ki saari posts mangwane ke liye (Calendar par show karne ke liye)"""
    try:
        response = supabase.table("scheduled_posts").select("*").eq("user_id", user_id).execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{post_id}/reschedule")
async def reschedule_post(post_id: str, body: dict, authorization: str = Header(None)):
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        
        response = supabase.table("scheduled_posts")\
            .update({"scheduled_for": body["scheduled_for"]})\
            .eq("id", post_id)\
            .eq("user_id", user.user.id)\
            .execute()
            
        return {"message": "Post rescheduled!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
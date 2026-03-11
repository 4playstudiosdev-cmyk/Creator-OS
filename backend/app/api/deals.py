import os
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()

class DealCreate(BaseModel):
    brand_name: str
    contact_email: Optional[str] = ""
    amount: Optional[float] = 0.00
    deliverables: Optional[str] = ""
    status: Optional[str] = "lead"
    due_date: Optional[str] = None

class DealStatusUpdate(BaseModel):
    status: str

# ✅ Saari deals fetch karo
@router.get("/user/{user_id}")
async def get_user_deals(user_id: str):
    try:
        response = supabase.table("brand_deals")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ✅ Nayi deal banao
@router.post("/create")
async def create_deal(deal: DealCreate, authorization: str = Header(None)):
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)

        data = {
            "user_id": user.user.id,
            "brand_name": deal.brand_name,
            "contact_email": deal.contact_email,
            "amount": deal.amount,
            "deliverables": deal.deliverables,
            "status": deal.status,
            "due_date": deal.due_date
        }

        response = supabase.table("brand_deals").insert(data).execute()
        return {"message": "Deal create ho gayi!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ✅ Deal status update karo (Kanban drag-drop ke liye)
@router.put("/{deal_id}/status")
async def update_deal_status(deal_id: str, body: DealStatusUpdate, authorization: str = Header(None)):
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)

        response = supabase.table("brand_deals")\
            .update({"status": body.status})\
            .eq("id", deal_id)\
            .eq("user_id", user.user.id)\
            .execute()

        return {"message": "Status update ho gaya!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ✅ Deal delete karo
@router.delete("/{deal_id}")
async def delete_deal(deal_id: str, authorization: str = Header(None)):
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)

        supabase.table("brand_deals")\
            .delete()\
            .eq("id", deal_id)\
            .eq("user_id", user.user.id)\
            .execute()

        return {"message": "Deal delete ho gayi!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
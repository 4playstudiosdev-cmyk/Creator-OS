from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api import posts, media_kit, ai, deals, social, captions, clipping
from app.api.scheduler import start_scheduler
from app.api.youtube import router as youtube_router
from app.api.linkedin import router as linkedin_router
from app.api.tiktok   import router as tiktok_router
from app.instagram import router as instagram_router

load_dotenv()

app = FastAPI()

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://creator-os-ochre.vercel.app",
        "https://nexoraos.online",
        "https://creator-os-production-0bf8.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(instagram_router)
app.include_router(youtube_router)
app.include_router(linkedin_router)
app.include_router(tiktok_router)
app.include_router(posts.router,     prefix="/api/posts")
app.include_router(media_kit.router, prefix="/api/media-kit")
app.include_router(ai.router,        prefix="/api/ai")
app.include_router(deals.router,     prefix="/api/deals")
app.include_router(social.router,    prefix="/api/social")
app.include_router(captions.router,  prefix="/api/captions")
app.include_router(clipping.router,  prefix="/api/clipping")


@app.on_event("startup")
async def startup_event():
    start_scheduler()


@app.get("/")
def root():
    return {"status": "Nexora OS Backend Running!", "version": "2.0"}
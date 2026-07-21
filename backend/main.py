import os
import logging
from dotenv import load_dotenv

# Load environment variables at the absolute entrypoint of the application
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth, payouts, webhooks

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("payoutiq")

# Database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to auto-create database tables on startup (ignoring): {e}")
    yield
    logger.info("Shutting down PayoutIQ Backend.")

app = FastAPI(
    title="PayoutIQ API",
    description="Bulk payout verification and disbursement engine using Monnify and Gemini",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
# Read allowed origins from env, standard fallback to common local/demo origins
allowed_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if allowed_origins_env:
    origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    origins = [
        "http://localhost:5173",  # Vite local frontend
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "*"                       # Open for other deployments
    ]

# If origins has "*", allow all
if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False, # Must be False if origin is '*'
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include Routers
app.include_router(auth.router)
app.include_router(payouts.router)
app.include_router(webhooks.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "PayoutIQ API Server",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

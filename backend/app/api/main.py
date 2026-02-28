"""
Main FastAPI application for Job Matching Platform
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes_auth import router as auth_router
from app.routes_profile import router as profile_router
from app.routes_jobs import router as jobs_router
from app.routes_analytics import router as analytics_router
from app.routes_jobs_public import router as jobs_public_router
from app.routes_quick_signup import router as quick_signup_router
from app.routes_constants import router as constants_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting Job Matching Platform API...")
    
    # Initialize Supabase Client
    await connect_to_mongo()
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await close_mongo_connection()
    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Intelligent job matching platform with automated resume parsing",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(constants_router)  # Constants (public)
app.include_router(jobs_public_router)  # Public endpoints first (no auth)
app.include_router(quick_signup_router)  # Quick signup
app.include_router(auth_router)  # Original auth endpoints
app.include_router(profile_router)
app.include_router(jobs_router)
app.include_router(analytics_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Job Matching Platform API",
        "version": settings.VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )


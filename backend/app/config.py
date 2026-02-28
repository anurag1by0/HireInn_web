"""
Configuration settings for the Job Matching Platform
"""
from pydantic.v1 import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Job Matching Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # MongoDB
    MONGODB_URI: str = ""
    DB_NAME: str = "job_matching_platform"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: Optional[str] = None
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "default-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Groq API
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_MAX_TOKENS: int = 8000
    GROQ_TEMPERATURE: float = 0.1
    
    # File Upload
    UPLOAD_DIR: str = "uploads/resumes"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".doc", ".txt", ".rtf"}
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Tesseract OCR
    TESSERACT_CMD: Optional[str] = None  # Path to tesseract executable
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

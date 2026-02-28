import logging
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

supabase: Client = None

def get_supabase_client() -> Client:
    global supabase
    if not supabase:
        try:
            url = settings.SUPABASE_URL
            key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY
            if not url or not key:
                logger.error("Supabase URL or Key missing in settings")
                return None
            
            supabase = create_client(url, key)
            logger.info("Supabase client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    return supabase

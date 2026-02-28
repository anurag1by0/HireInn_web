"""
Re-export database functions so 'from app.database import ...' works
when app/database/ is a package (folder) rather than a single file.
"""
import logging
from app.supabase_db import get_supabase_client

logger = logging.getLogger(__name__)

async def connect_to_mongo():
    """Legacy Adapter: Initialize Supabase"""
    try:
        client = get_supabase_client()
        if client:
            logger.info("Supabase Client Ready")
        else:
            logger.error("Supabase Client Failed to Initialize")
    except Exception as e:
        logger.error(f"Supabase Init Error: {e}")

async def close_mongo_connection():
    """Legacy Adapter: No-op for Supabase"""
    pass

def get_database():
    return get_supabase_client()

def get_users_collection():
    return get_supabase_client().table('local_users')

def get_profiles_collection():
    return get_supabase_client().table('profiles')

def get_jobs_collection():
    return get_supabase_client().table('jobs')

def get_saved_jobs_collection():
    return get_supabase_client().table('saved_jobs')

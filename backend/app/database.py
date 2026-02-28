"""
Supabase database connection adapter
"""
import logging
from app.supabase_db import get_supabase_client

logger = logging.getLogger(__name__)

async def connect_to_mongo():
    """Legacy Adapter: Initialize Supabase"""
    try:
        client = get_supabase_client()
        if client:
            logger.info("Supabase Client Ready (Replaces MongoDB)")
        else:
            logger.error("Supabase Client Failed to Initialize")
    except Exception as e:
        logger.error(f"Supabase Init Error: {e}")

async def close_mongo_connection():
    """Legacy Adapter: No-op for Supabase"""
    pass

# Helper to access client easily
def get_database():
    return get_supabase_client()

# Collection accessors now return the Table Queries usually, 
# but effectively we should use `supabase.table('table_name')` in routes.
# These are kept to prevent 'ImportError' in routes before we refactor them.
def get_users_collection():
    return get_supabase_client().table('local_users')

def get_profiles_collection():
    return get_supabase_client().table('profiles')

def get_jobs_collection():
    return get_supabase_client().table('jobs')

def get_saved_jobs_collection():
    return get_supabase_client().table('saved_jobs')

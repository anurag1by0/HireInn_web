import os
import logging
from datetime import datetime
# from pymongo import MongoClient... # Removed
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# We use the Service Key for writing/admin tasks if available, else Anon
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

class SupabaseHandler:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
             logging.error("Supabase Credentials Missing in Scraper Handler")
             self.client = None
        else:
             self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
             logging.info("Supabase Client (Scraper) initialized.")

    def reset_database(self):
        """Clear jobs table (Danger!)"""
        if not self.client: return
        # Supabase doesn't easily allow 'truncate' via client unless RLS policies allow delete/all.
        # We might skip this or use delete not-eq-to-some-impossible-id
        try:
            self.client.table("jobs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            logging.info("Supabase Jobs Table cleared.")
        except Exception as e:
            logging.error(f"Error clearing DB: {e}")

    def _init_indexes(self):
        pass # Not needed for Supabase/Postgres (managed via SQL)

    def insert_jobs(self, jobs: list):
        """Insert multiple jobs, ignoring duplicates."""
        if not jobs or not self.client:
            return 0
        
        inserted_count = 0
        
        # Prepare jobs for Supabase schema
        # Jobs coming from Scraper might have different fields.
        # We map them to our 'jobs' table:
        # id (auto/uuid), company, role, location, description, source_url (mapped from url), 
        # posted_at, is_remote, job_type, salary_range
        
        formatted_batch = []
        for job in jobs:
            formatted_job = {
                # "id": ... generate or let db do it? DB default is uuid_generate_v4()
                "company": job.get("company", "Unknown"),
                "role": job.get("role", "Unknown"),
                "location": job.get("location"),
                "description": job.get("description"),
                "is_remote": job.get("is_remote", False),
                "source_url": job.get("url"), # map url -> source_url
                "job_id": job.get("job_id"), # external id
                "posted_at": job.get("posted_at").isoformat(),
                "job_type": job.get("type"), # map type -> job_type
                "salary_range": job.get("salary"), # map salary -> salary_range
                # "experience_level": job.get("experience") # map
            }
            formatted_batch.append(formatted_job)
        
        # Upsert batch (using upsert to avoid dups on job_id if unique constraint exists)
        # We assumed job_id is unique in SQL schema.
        try:
            res = self.client.table("jobs").upsert(formatted_batch, on_conflict="job_id").execute()
            # Count inserted? Upsert returns data.
            if res.data:
                inserted_count = len(res.data)
        except Exception as e:
             logging.error(f"Supabase Insert Error: {e}")
             
        return inserted_count

    def insert_invalid_jobs(self, jobs: list):
        """Insert multiple invalid jobs."""
        if not jobs or not self.client:
            return 0
        
        inserted_count = 0
        formatted_batch = []
        for job in jobs:
            formatted_job = {
                "job_id": job.get("job_id"),
                "company": job.get("company", "Unknown"),
                "role": job.get("role", "Unknown"),
                "location": job.get("location"),
                "description": job.get("description"),
                "source_url": job.get("url"),
                "posted_at": job.get("posted_at").isoformat(),
                "reason": "Verification Failed", # Or allow passing reason
                "checked_at": datetime.utcnow().isoformat()
            }
            formatted_batch.append(formatted_job)
        
        try:
            res = self.client.table("invalid_jobs").upsert(formatted_batch, on_conflict="job_id").execute()
            if res.data:
                inserted_count = len(res.data)
        except Exception as e:
             logging.error(f"Supabase Invalid Job Insert Error: {e}")
             
        return inserted_count

    def get_latest_jobs(self, limit=50):
        if not self.client: return []
        res = self.client.table("jobs").select("*").order("posted_at", desc=True).limit(limit).execute()
        return res.data if res.data else []

    def delete_expired_jobs(self):
        """Delete jobs older than 30 days."""
        if not self.client: return 0
        
        # Calculate threshold date
        from datetime import timedelta
        threshold = (datetime.utcnow() - timedelta(days=30)).isoformat()
        
        try:
            # lt = less than
            res = self.client.table("jobs").delete().lt("posted_at", threshold).execute()
            if res.data:
                count = len(res.data)
                logging.info(f"Deleted {count} expired jobs.")
                return count
        except Exception as e:
             logging.error(f"Error deleting expired jobs: {e}")
             
        return 0
db_handler = SupabaseHandler()

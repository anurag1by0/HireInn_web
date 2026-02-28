
import asyncio
import logging
from app.database.mongo_client import db_handler
from app.verification.verifier import Verifier
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_invalid_jobs():
    logger.info("Starting Invalid Jobs Check Process...")
    
    verifier = Verifier()
    
    # Fetch invalid jobs
    # Assuming we can fetch from invalid_jobs table
    if not db_handler.client:
        logger.error("Database client not available.")
        return

    try:
        # Fetch up to 50 invalid jobs to re-check
        res = db_handler.client.table("invalid_jobs").select("*").limit(50).execute()
        invalid_jobs = res.data
        
        if not invalid_jobs:
            logger.info("No invalid jobs found to check.")
            return

        logger.info(f"Checking {len(invalid_jobs)} invalid jobs...")

        for job in invalid_jobs:
            # Map back to normalized format if needed, but schema should be similar
            # verification needs: job_id, company, role, description, url, location
            
            # Prepare check
            job_to_check = {
                "job_id": job.get("job_id"),
                "company": job.get("company"),
                "role": job.get("role"),
                "description": job.get("description"),
                "url": job.get("source_url"), # mapped back
                "location": job.get("location"),
                # Pass other fields to preserve them
                "is_remote": job.get("is_remote"),
                "posted_at": job.get("posted_at"),
                "type": job.get("job_type"),
                "salary": job.get("salary_range")
            }
            
            # Re-verify
            is_valid = await verifier.verify_job(job_to_check)
            
            if is_valid:
                logger.info(f"Job {job.get('job_id')} is now VALID! Moving to jobs table.")
                
                # Insert to jobs
                # We need to format it again for insert_jobs, which expects list of dicts 
                # similar to scraper output.
                # insert_jobs handles mapping, so we pass raw-ish dict?
                # insert_jobs expects: company, role, location, description, url, job_id, posted_at...
                
                # We can construct the dict for insert_jobs
                valid_job = {
                    "job_id": job.get("job_id"),
                    "company": job.get("company"),
                    "role": job.get("role"),
                    "location": job.get("location"),
                    "description": job.get("description"),
                    "url": job.get("source_url"),
                    "posted_at": datetime.fromisoformat(job.get("posted_at")) if isinstance(job.get("posted_at"), str) else job.get("posted_at"),
                    "is_remote": job.get("is_remote"),
                    "type": job.get("job_type"),
                    "salary": job.get("salary_range")
                }
                
                res_insert = db_handler.insert_jobs([valid_job])
                
                if res_insert > 0:
                    # Delete from invalid_jobs
                    db_handler.client.table("invalid_jobs").delete().eq("job_id", job.get("job_id")).execute()
                    logger.info(f"Moved job {job.get('job_id')} successfully.")
                else:
                    logger.warning(f"Failed to insert job {job.get('job_id')} into jobs table.")
            else:
                logger.debug(f"Job {job.get('job_id')} still invalid.")
                
    except Exception as e:
        logger.error(f"Error processing invalid jobs: {e}")

if __name__ == "__main__":
    asyncio.run(process_invalid_jobs())

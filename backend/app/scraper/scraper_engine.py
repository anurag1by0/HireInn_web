import logging
import pandas as pd
from datetime import datetime, timedelta
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Import from valid package structure assuming run from backend root
from app.database.mongo_client import db_handler
from app.verification.verifier import Verifier
try:
    from jobspy import scrape_jobs
except ImportError:
    logging.warning("JobSpy not installed or found.")
    scrape_jobs = None

# Playwright fallback disabled — conflicts with httpx/supabase async context causing silent crash
async def scrape_naukri_fallback(term: str, location: str, limit: int = 10):
    return []


logging.basicConfig(level=logging.INFO)

try:
    verifier = Verifier()
except Exception as e:
    logging.error(f"Failed to init Verifier: {e}")
    verifier = None

def run_jobspy(term, location, results_wanted=10):
    if not scrape_jobs:
        return []
    
    # Map 'naukri' isn't standard in JobSpy explicit args usually, but we try passing it in site_name
    # if it supports it. based on search result, it does.
    
    try:
        jobs: pd.DataFrame = scrape_jobs(
            site_name=["indeed", "linkedin", "glassdoor"], 
            search_term=term,
            location=location,
            results_wanted=results_wanted,
            country_indeed='USA', # Configurable
            # proxies=["http://proxy:port"] # Add proxies here if available
        )
        return jobs.to_dict('records')
    except Exception as e:
        logging.error(f"JobSpy scraping failed: {e}")
        return []

async def process_jobs(jobs_data):
    """Normalize, verify, and store jobs."""
    validated_jobs = []
    invalid_jobs = []
    
    _verifier = verifier or Verifier()

    for job in jobs_data:
        try:
            normalized = {
                "job_id": job.get("id") or job.get("job_url"),
                "company": job.get("company"),
                "role": job.get("title"),
                "description": str(job.get("description") or ""),
                "location": str(job.get("location") or ""),
                "is_remote": "remote" in str(job.get("location") or "").lower() or "remote" in str(job.get("description") or "").lower(),
                "type": str(job.get("job_type") or "Full-time"),
                "posted_at": datetime.combine(job.get("date_posted"), datetime.min.time()) if hasattr(job.get("date_posted"), 'year') and not hasattr(job.get("date_posted"), 'hour') else (job.get("date_posted") or datetime.utcnow()),
                "url": job.get("job_url") or job.get("url"),
                "source": job.get("site", "unknown"),
                "is_verified": False,
                "expire_at": datetime.utcnow() + timedelta(days=30)
            }

            is_valid = await _verifier.verify_job(normalized)
            if is_valid:
                normalized["is_verified"] = True
                validated_jobs.append(normalized)
            else:
                logging.info(f"Discarding job: {normalized.get('role')} due to verification failure.")
                invalid_jobs.append(normalized)
        except Exception as e:
            logging.error(f"Error processing job: {e}")

    # Store
    count = db_handler.insert_jobs(validated_jobs)
    count_invalid = db_handler.insert_invalid_jobs(invalid_jobs)
    logging.info(f"Stored {count} new verified jobs and {count_invalid} invalid jobs.")

async def run_scraper_pipeline(term="Technology", location="Remote"):
    logging.info(f"Starting scraper pipeline for {term} in {location}")
    
    # 1. Run JobSpy (Sync in ThreadPool)
    loop = asyncio.get_running_loop()
    with ThreadPoolExecutor() as pool:
        jobspy_jobs = await loop.run_in_executor(pool, run_jobspy, term, location)
    
    logging.info(f"JobSpy found {len(jobspy_jobs)} jobs.")

    # 2. Run Fallback if needed (or always for Naukri if JobSpy didn't cover it effectively)
    # We'll run Naukri fallback concurrently or if JobSpy result is low
    playwright_jobs = []
    if len(jobspy_jobs) < 5: 
        logging.info("JobSpy results low, triggering Playwright fallback for Naukri.")
        playwright_jobs = await scrape_naukri_fallback(term, location)
    
    all_jobs = jobspy_jobs + playwright_jobs
    
    # 3. Process
    await process_jobs(all_jobs)

if __name__ == "__main__":
    asyncio.run(run_scraper_pipeline())

"""
Standalone scraper runner - no asyncio, no conflicts.
Runs JobSpy synchronously and inserts directly to Supabase.
Run: python run_scraper.py
"""
import os
import time
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("scraper.log")
    ]
)

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

client = create_client(SUPABASE_URL, SUPABASE_KEY)
logging.info("Supabase connected.")

try:
    from jobspy import scrape_jobs
    logging.info("JobSpy loaded.")
except ImportError:
    logging.error("JobSpy not installed! Run: pip install python-jobspy")
    exit(1)

SEARCH_QUERIES = [
    {"term": "Software Engineer", "location": "India"},
    {"term": "Backend Developer", "location": "India"},
    {"term": "Frontend Developer", "location": "India"},
    {"term": "Data Scientist", "location": "India"},
    {"term": "DevOps Engineer", "location": "India"},
    {"term": "Product Manager", "location": "India"},
    {"term": "Machine Learning Engineer", "location": "India"},
    {"term": "Full Stack Developer", "location": "India"},
    {"term": "Python Developer", "location": "India"},
    {"term": "React Developer", "location": "India"},
    {"term": "Software Engineer", "location": "Remote"},
    {"term": "Backend Engineer", "location": "Remote"},
    {"term": "Data Engineer", "location": "India"},
]

def scrape_and_store(term: str, location: str, results_wanted: int = 15):
    """Run one scraping cycle and insert results into Supabase."""
    logging.info(f"Scraping: '{term}' in '{location}'")
    
    try:
        jobs_df = scrape_jobs(
            site_name=["indeed", "linkedin"],
            search_term=term,
            location=location,
            results_wanted=results_wanted,
            country_indeed='India',
        )
        logging.info(f"JobSpy returned {len(jobs_df)} raw jobs")
    except Exception as e:
        logging.error(f"JobSpy failed: {e}")
        return 0

    if jobs_df.empty:
        logging.info("No jobs found in this cycle.")
        return 0

    # Normalize and prepare for Supabase
    formatted = []
    for _, job in jobs_df.iterrows():
        try:
            company = str(job.get("company") or "").strip()
            role = str(job.get("title") or "").strip()
            url = str(job.get("job_url") or "").strip()

            # Skip if missing critical fields
            if not company or not role or not url:
                continue

            # Skip generic/spam company names
            bad_names = ["confidential", "hiring", "staffing", "recruitment", "agency"]
            if any(b in company.lower() for b in bad_names):
                continue

            date_posted = job.get("date_posted")
            if hasattr(date_posted, 'year') and not hasattr(date_posted, 'hour'):
                posted_at = datetime.combine(date_posted, datetime.min.time()).isoformat()
            elif date_posted:
                posted_at = str(date_posted)
            else:
                posted_at = datetime.utcnow().isoformat()

            loc = str(job.get("location") or location).strip()
            desc = str(job.get("description") or "")[:2000]  # cap description
            is_remote = "remote" in loc.lower() or "remote" in desc.lower()

            formatted.append({
                "job_id": url,  # URL as unique ID
                "company": company,
                "role": role,
                "location": loc,
                "description": desc,
                "is_remote": is_remote,
                "source_url": url,
                "posted_at": posted_at,
                "job_type": str(job.get("job_type") or "Full-time"),
                "salary_range": str(job.get("min_amount") or "") or None,
            })
        except Exception as e:
            logging.warning(f"Error formatting job: {e}")
            continue

    if not formatted:
        logging.info("No valid jobs after filtering.")
        return 0

    # Batch upsert to Supabase
    try:
        res = client.table("jobs").upsert(formatted, on_conflict="job_id").execute()
        count = len(res.data) if res.data else 0
        logging.info(f"Inserted/updated {count} jobs in Supabase.")
        return count
    except Exception as e:
        logging.error(f"Supabase insert failed: {e}")
        return 0


def delete_expired():
    """Delete jobs older than 30 days."""
    threshold = (datetime.utcnow() - timedelta(days=30)).isoformat()
    try:
        res = client.table("jobs").delete().lt("posted_at", threshold).execute()
        count = len(res.data) if res.data else 0
        if count > 0:
            logging.info(f"Deleted {count} expired jobs.")
    except Exception as e:
        logging.warning(f"Expiry cleanup failed: {e}")


def get_total_count():
    try:
        res = client.table("jobs").select("id", count="exact").execute()
        return res.count or 0
    except:
        return -1


def main():
    logging.info("=" * 50)
    logging.info("HireInn Scraper Started")
    logging.info("=" * 50)
    
    rotation = 0
    cycle = 0

    while True:
        cycle += 1
        query = SEARCH_QUERIES[rotation % len(SEARCH_QUERIES)]
        rotation += 1

        logging.info(f"\n--- Cycle {cycle} | Query: {query} ---")

        count = scrape_and_store(query["term"], query["location"])

        # Every 5 cycles, run cleanup
        if cycle % 5 == 0:
            delete_expired()

        total = get_total_count()
        logging.info(f"Total jobs in DB: {total}")

        logging.info("Sleeping 90 seconds before next cycle...")
        time.sleep(90)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logging.info("Scraper stopped by user.")

import asyncio
import logging
import time
from app.scraper.scraper_engine import run_scraper_pipeline
from app.database.mongo_client import db_handler
from app.scraper.check_invalid import process_invalid_jobs

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def main_loop():
    logging.info("Starting Continuous Scraper Service...")
    
    # Broad corporate search (Global/Remote/Any)
    # User requested: "no location filters no role filters no remote or wfh filters all kind of corporate jobs"
    # We rotate through broad sectors to get "all kinds".
    search_queries = [
        {"term": "Manager", "location": ""},
        {"term": "Engineer", "location": ""},
        {"term": "Analyst", "location": ""},
        {"term": "Consultant", "location": ""},
        {"term": "Executive", "location": ""},
        {"term": "Director", "location": ""},
        {"term": "Developer", "location": ""},
        {"term": "Designer", "location": ""},
        {"term": "Marketing", "location": ""},
        {"term": "Sales", "location": ""},
        {"term": "HR", "location": ""},
        {"term": "Finance", "location": ""},
        {"term": "Operations", "location": ""}
    ]
    
    rotation_index = 0
    
    while True:
        try:
            # Pick next query from rotation
            query = search_queries[rotation_index]
            logging.info(f"Running Job Scraper Pipeline for: {query}")
            
            # 1. Run the scraper pipeline with specific query
            # If location is empty, JobSpy might treat it as global or default.
            await run_scraper_pipeline(term=query["term"], location=query["location"])
            
            # Rotate index
            rotation_index = (rotation_index + 1) % len(search_queries)
            
            # 2. Cleanup & verify invalid jobs
            db_handler.delete_expired_jobs()
            logging.info("Checking invalid jobs...")
            await process_invalid_jobs()
            
            # 3. Sleep before next run
            # Run faster? User wants to populate. 
            sleep_time = 60 # 1 minute between scrapes
            logging.info(f"Sleeping for {sleep_time} seconds...")
            await asyncio.sleep(sleep_time)
            
        except Exception as e:
            logging.error(f"Critical Loop Error: {e}")
            logging.info("Retrying in 60 seconds...")
            await asyncio.sleep(60)

if __name__ == "__main__":
    try:
        asyncio.run(main_loop())
    except KeyboardInterrupt:
        logging.info("Scraper Service Stopped by User.")

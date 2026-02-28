
import asyncio
import logging
import sys

# Ensure stdout logging
logging.basicConfig(stream=sys.stdout, level=logging.INFO)

try:
    from app.scraper.scraper_engine import run_scraper_pipeline
except ImportError as e:
    logging.error(f"Import Error: {e}")
    sys.exit(1)

async def dry_run():
    print("--- STARTING DRY RUN ---")
    
    # Test parameters
    term = "Python Developer"
    location = "Remote" # Use Remote for JobSpy to likely find something
    
    try:
        await run_scraper_pipeline(term=term, location=location)
        print("--- DRY RUN COMPLETE ---")
    except Exception as e:
        print(f"--- DRY RUN FAILED: {e} ---")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(dry_run())

"""
Run a single scraper pipeline cycle directly.
Tests jobspy →  Supabase insert.
"""
import asyncio
import logging
import sys

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s', stream=sys.stdout)

async def main():
    logging.info("Testing scraper pipeline...")
    
    try:
        from app.scraper.scraper_engine import run_scraper_pipeline
        logging.info("Imports OK, running pipeline...")
        await run_scraper_pipeline(term="Software Engineer", location="India")
        logging.info("Pipeline completed!")
    except Exception as e:
        logging.error(f"Pipeline failed: {e}", exc_info=True)

asyncio.run(main())

"""Debug wrapper to check scraper startup errors."""
import sys
import traceback
print("Python:", sys.executable)
print("Testing imports step by step...")

try:
    import asyncio
    print("[OK] asyncio")
except Exception as e:
    print(f"[FAIL] asyncio: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    import pandas as pd
    print("[OK] pandas")
except Exception as e:
    print(f"[FAIL] pandas: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    from app.database.mongo_client import db_handler
    print("[OK] app.database.mongo_client")
except Exception as e:
    print(f"[FAIL] app.database.mongo_client: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    from app.verification.verifier import Verifier
    print("[OK] app.verification.verifier")
except Exception as e:
    print(f"[FAIL] app.verification.verifier: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    from app.scraper.playwright_fallback import scrape_naukri_fallback
    print("[OK] app.scraper.playwright_fallback")
except Exception as e:
    print(f"[FAIL] app.scraper.playwright_fallback: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    from app.scraper.check_invalid import process_invalid_jobs
    print("[OK] app.scraper.check_invalid")
except Exception as e:
    print(f"[FAIL] app.scraper.check_invalid: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    from app.scraper.run_continuous import main_loop
    print("[OK] app.scraper.run_continuous")
except Exception as e:
    print(f"[FAIL] app.scraper.run_continuous: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\nAll imports successful! Running scraper for one cycle...")

async def one_cycle():
    from app.scraper.scraper_engine import run_scraper_pipeline
    await run_scraper_pipeline(term="Software Engineer", location="India")
    print("One cycle done!")

asyncio.run(one_cycle())

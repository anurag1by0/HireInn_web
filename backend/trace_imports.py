"""
Step by step import tester with full exception printing.
"""
import sys
import traceback

print("Step 1: basic imports")
import asyncio
import logging
logging.basicConfig(level=logging.DEBUG, stream=sys.stdout)

print("Step 2: db_handler")
try:
    from app.database.mongo_client import db_handler
    print(" => OK")
except Exception:
    traceback.print_exc()
    sys.exit(1)

print("Step 3: Verifier")
try:
    from app.verification.verifier import Verifier
    v = Verifier()
    print(" => OK")
except Exception:
    traceback.print_exc()
    sys.exit(1)

print("Step 4: scraper_engine (may crash here)")
try:
    from app.scraper import scraper_engine
    print(" => OK")
except SystemExit as e:
    print(f"SystemExit: {e}")
    traceback.print_exc()
    sys.exit(1)
except Exception:
    traceback.print_exc()
    sys.exit(1)

print("Step 5: run_continuous")
try:
    from app.scraper import run_continuous
    print(" => OK")
except SystemExit as e:
    print(f"SystemExit: {e}")
    traceback.print_exc()
    sys.exit(1)
except Exception:
    traceback.print_exc()
    sys.exit(1)

print("All imports passed!")

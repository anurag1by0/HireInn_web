import traceback
import sys

try:
    from app import routes_auth
    print("SUCCESS!")
except Exception as e:
    print(f"ERROR: {type(e).__name__}")
    print(f"Message: {str(e)}")
    traceback.print_exc()
    sys.exit(1)

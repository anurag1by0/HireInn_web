import sys
import traceback

print("Python executable:", sys.executable)
print("Path:", sys.path)

print("Attempting import of app.api.main...")
try:
    from app.api.main import app
    print("Import SUCCESS")
except Exception:
    traceback.print_exc()
except SystemExit:
    pass

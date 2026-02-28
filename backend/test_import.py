import traceback

try:
    from app.api.main import app
    print("SUCCESS: App imported!")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {str(e)}")
    traceback.print_exc()

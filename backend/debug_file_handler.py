import sys
import traceback

print("Testing file_handler import...")
print("=" * 60)

try:
    print("Step 1: Importing config...")
    from app.config import settings
    print(f"  ✓ Config loaded. UPLOAD_DIR: {settings.UPLOAD_DIR}")
    
    print("Step 2: Importing Path...")
    from pathlib import Path
    print("  ✓ Path imported")
    
    print("Step 3: Creating Path object...")
    upload_dir = Path(settings.UPLOAD_DIR)
    print(f"  ✓ Path created: {upload_dir}")
    
    print("Step 4: Creating directory...")
    upload_dir.mkdir(parents=True, exist_ok=True)
    print("  ✓ Directory created")
    
    print("Step 5: Importing file_handler module...")
    from app import file_handler
    print("  ✓ file_handler imported successfully!")
    
except Exception as e:
    print(f"\n❌ ERROR at current step:")
    print(f"   Type: {type(e).__name__}")
    print(f"   Message: {str(e)}")
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)

print("\n✅ All imports successful!")

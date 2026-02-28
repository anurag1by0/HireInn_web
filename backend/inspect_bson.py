
import sys
try:
    import bson
    print(f"BSON File: {bson.__file__}")
    print(f"BSON Dir: {dir(bson)}")
except ImportError:
    print("Could not import bson")

try:
    from bson import ObjectId
    print("ObjectId imported successfully")
except ImportError as e:
    print(f"Failed to import ObjectId: {e}")

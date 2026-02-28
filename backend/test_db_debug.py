import asyncio
import os
import socket
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
from urllib.parse import urlparse

# Load env variables manually to avoid app dependencies
from dotenv import load_dotenv
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("❌ ERROR: MONGODB_URI not found in .env")
    sys.exit(1)

async def test_connection():
    print(f"🔍 Testing MongoDB Connection...")
    print(f"📌 URI: {MONGODB_URI.split('@')[1] if '@' in MONGODB_URI else '***'}") # Hide creds
    
    # 1. DNS Resolution
    try:
        # Extract hostname
        hostname = MONGODB_URI.split('@')[1].split('/')[0]
        if 'mongodb+srv://' in MONGODB_URI:
             # SRV record handling is complex, skip raw socket if SRV
             print(f"ℹ️  SRV URI detected, skipping raw socket test.")
        else:
            host = hostname.split(':')[0]
            print(f"🔄 Resolving {host}...")
            ip_list = socket.gethostbyname_ex(host)
            print(f"✅ DNS Resolved: {ip_list}")
    except Exception as e:
        print(f"⚠️  DNS Resolution Warning: {e}")

    # 2. Motor Connection
    print("\n🚀 Attempting Driver Connection (Timeout 5s)...")
    client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    
    try:
        # Force a call
        start_time = asyncio.get_event_loop().time()
        start = loop.time() if 'loop' in locals() else 0 # correction
        import time
        t0 = time.time()
        
        await client.admin.command('ping')
        
        duration = time.time() - t0
        print(f"✅ FAILURE IS NOT AN OPTION! Connected in {duration:.2f}s")
        print("🎉 Verify: Database is accessible!")
        
    except ServerSelectionTimeoutError as e:
        print(f"❌ CONNECTION FAILED: Server Selection Timeout")
        print(f"Details: {e}")
        print("\nPossible Causes:")
        print("1. IP WHITELIST: Go to MongoDB Atlas -> Network Access -> Add IP Address -> 'Add Current IP Address'")
        print("2. FIREWALL: Ensure Port 27017 is open (Corporate VPNs often block this)")
        print("3. DNS: Your network might block 'mongodb+srv' lookups.")
    except Exception as e:
         print(f"❌ UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())

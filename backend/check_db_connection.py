
import os
import sys
import socket
from urllib.parse import urlparse
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def check_connection():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    print(f"Checking connection to: {url}")

    if not url:
        print("Error: SUPABASE_URL is not set.")
        return

    try:
        print("Checking internet connectivity (google.com)...")
        socket.gethostbyname("google.com")
        print("Internet OK.")
    except:
        print("Internet Connection FAILED. Cannot reach google.com")
        return

    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        print(f"Resolving hostname: {hostname}")
        
        # Test DNS
        try:
            ip = socket.gethostbyname(hostname)
            print(f"DNS Resolution Success: {hostname} -> {ip}")
        except socket.gaierror as e:
            print(f"DNS Resolution FAILED: {e}")
            return

        # Test Client Init
        print("Initializing Supabase Client...")
        client = create_client(url, key)
        
        # Test Query
        print("Testing Query (fetching 1 job)...")
        res = client.table("jobs").select("id", count="exact").limit(1).execute()
        print(f"Query Success! Found {res.count} jobs.")
        
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_connection()

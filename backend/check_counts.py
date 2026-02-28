import sys
import os
import asyncio

# Add current directory to sys.path
sys.path.append(os.getcwd())

from app.database import connect_to_mongo, get_database, close_mongo_connection

async def check_db():
    print("Connecting to DB...")
    await connect_to_mongo()
    client = get_database()
    
    # Check jobs
    try:
        jobs_res = client.table("jobs").select("*", count="exact").execute()
        print(f"Jobs count: {jobs_res.count}")
        if jobs_res.data:
            print("Sample Job:", jobs_res.data[0])
        else:
            print("No jobs found in DB.")
    except Exception as e:
        print(f"Error checking jobs: {e}")

    # Check invalid_jobs
    try:
        invalid_res = client.table("invalid_jobs").select("*", count="exact").execute()
        print(f"Invalid Jobs count: {invalid_res.count}")
    except Exception as e:
        print(f"Error checking invalid_jobs: {e}")

    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_db())

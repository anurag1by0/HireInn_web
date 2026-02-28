import asyncio
import os
from supabase import create_client, Client
# Manually load env since we are running as script
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# Use Service Key for admin tasks (create table)
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SQL_MIGRATION = """
-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- 1. Users Table (Custom Auth)
create table if not exists public.local_users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  password_hash text not null,
  name text,
  is_active boolean default true,
  created_at timestamptz default now(),
  last_login timestamptz
);

-- 2. Profiles Table
create table if not exists public.profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.local_users(id),
  full_name text,
  experience_years int,
  preferred_role text,
  preferred_location text,
  skills text[], 
  resume_url text,
  parsing_status text default 'pending',
  parsed_data jsonb,
  created_at timestamptz default now(),
  unique(user_id)
);

-- 3. Jobs Table
create table if not exists public.jobs (
  id uuid default uuid_generate_v4() primary key,
  job_id text unique, -- Legacy/External ID
  company text not null,
  role text not null,
  location text,
  description text,
  salary_range text,
  job_type text,
  is_remote boolean default false,
  experience_level text,
  skills_required text[],
  posted_at timestamptz default now(),
  source_url text,
  is_active boolean default true
);

-- 4. Saved Jobs (Optional but good to have)
create table if not exists public.saved_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.local_users(id),
  job_id uuid references public.jobs(id),
  saved_at timestamptz default now(),
  unique(user_id, job_id)
);
"""

def run_migration():
    print("🚀 Starting Supabase Migration...")
    try:
        # Supabase-py doesn't have a direct 'query' method for DDL in the standard client usually,
        # but the postgres interface (rpc) can be used if we create a stored proc, OR we assume
        # the user has the SQL Editor.
        # BUT, recently supabase-py allows `rpc` call.
        # However, we can't run raw SQL from client unless we use the REST API `rpc` to a function that runs sql?
        # WAIT. Authentication via Service Key allows Management API?
        # Actually, standard supabase-py does NOT allow running raw SQL DDL directly for security.
        
        # PLAN B: We can't run DDL from here easily without a pre-existing RPC function `exec_sql`.
        # I will print the SQL and ask the User to parse it in the SQL Editor?
        # OR use `postgrest` execution? No.
        
        # Let's try to see if there is a 'query' endpoint or similar on newer libs.
        # If not, I will ask user to paste SQL.
        
        # BUT, user gave me SERVICE_ROLE key.
        # Maybe I can use `requests` to call the `pg_meta` API if exposed?
        
        # Let's try to just use valid Tables logic.
        # If tables don't exist, code will fail.
        
        print("\n⚠️  IMPORTANT: Supabase Client cannot execute RAW SQL DDL (Table Creation) directly.")
        print("Please copy the following SQL and run it in your Supabase Dashboard > SQL Editor:\n")
        print("="*50)
        print(SQL_MIGRATION)
        print("="*50)
        
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    run_migration()

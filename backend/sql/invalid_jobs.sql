-- Create table for invalid jobs if not exists
create table if not exists public.invalid_jobs (
  id uuid default uuid_generate_v4() primary key,
  job_id text unique,
  company text,
  role text,
  location text,
  description text,
  source_url text,
  reason text,
  checked_at timestamptz default now(),
  posted_at timestamptz,
  is_remote boolean,
  job_type text,
  salary_range text
);

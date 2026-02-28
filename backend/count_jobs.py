from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()
client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY'))

res = client.table('jobs').select('id, company, role, location, posted_at', count='exact').execute()
print(f'Total jobs in Supabase: {res.count}')
print()
for job in res.data:
    print(f"  {job['company']:25} | {job['role']:30} | {job['location']:20} | {str(job['posted_at'])[:10]}")

"""
Seed Supabase with sample jobs to verify the pipeline end-to-end.
Run: python seed_jobs.py
"""
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_KEY not set in .env")
    sys.exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)

SAMPLE_JOBS = [
    {
        "company": "Google",
        "role": "Software Engineer",
        "location": "Bengaluru, India",
        "description": "Build and scale Google's core products. Work on distributed systems, ML pipelines, and more.",
        "is_remote": False,
        "source_url": "https://careers.google.com",
        "job_id": "google-swe-blr-001",
        "posted_at": datetime.utcnow().isoformat(),
        "job_type": "Full-time",
        "salary_range": "₹30L - ₹60L",
        "experience_level": "3-5 years",
        "skills_required": ["Python", "Go", "Distributed Systems", "Kubernetes"]
    },
    {
        "company": "Microsoft",
        "role": "Senior Backend Engineer",
        "location": "Hyderabad, India",
        "description": "Join Azure team to build cloud-native services at scale. C#, .NET, Azure experience preferred.",
        "is_remote": True,
        "source_url": "https://careers.microsoft.com",
        "job_id": "msft-backend-hyd-001",
        "posted_at": datetime.utcnow().isoformat(),
        "job_type": "Full-time",
        "salary_range": "₹25L - ₹50L",
        "experience_level": "5-8 years",
        "skills_required": ["C#", ".NET", "Azure", "SQL Server"]
    },
    {
        "company": "Flipkart",
        "role": "Data Scientist",
        "location": "Bengaluru, India",
        "description": "Apply ML and statistical models to improve recommendations, search, and supply chain.",
        "is_remote": False,
        "source_url": "https://www.flipkartcareers.com",
        "job_id": "fk-ds-blr-001",
        "posted_at": datetime.utcnow().isoformat(),
        "job_type": "Full-time",
        "salary_range": "₹20L - ₹40L",
        "experience_level": "1-3 years",
        "skills_required": ["Python", "Machine Learning", "SQL", "TensorFlow"]
    },
    {
        "company": "Razorpay",
        "role": "Frontend Engineer",
        "location": "Bengaluru, India",
        "description": "Build world-class payment UX for millions of Indian businesses. React, TypeScript, performance focus.",
        "is_remote": True,
        "source_url": "https://razorpay.com/jobs",
        "job_id": "rzp-fe-blr-001",
        "posted_at": datetime.utcnow().isoformat(),
        "job_type": "Full-time",
        "salary_range": "₹18L - ₹35L",
        "experience_level": "1-3 years",
        "skills_required": ["React", "TypeScript", "CSS", "Node.js"]
    },
    {
        "company": "Swiggy",
        "role": "DevOps Engineer",
        "location": "Bengaluru, India",
        "description": "Manage CI/CD pipelines, Kubernetes clusters, and cloud infra for India's top food delivery platform.",
        "is_remote": False,
        "source_url": "https://careers.swiggy.com",
        "job_id": "swiggy-devops-blr-001",
        "posted_at": datetime.utcnow().isoformat(),
        "job_type": "Full-time",
        "salary_range": "₹15L - ₹30L",
        "experience_level": "3-5 years",
        "skills_required": ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD"]
    },
    {
        "company": "Zepto",
        "role": "Product Manager",
        "location": "Mumbai, India",
        "description": "Drive product strategy for quick commerce. Work with engineering, design, and ops teams.",
        "is_remote": False,
        "source_url": "https://www.zepto.team/careers",
        "job_id": "zepto-pm-mum-001",
        "posted_at": datetime.utcnow().isoformat(),
        "job_type": "Full-time",
        "salary_range": "₹25L - ₹45L",
        "experience_level": "3-5 years",
        "skills_required": ["Product Strategy", "SQL", "A/B Testing", "Agile"]
    },
    {
        "company": "CRED",
        "role": "Android Developer",
        "location": "Bengaluru, India",
        "description": "Build premium Android experiences for CRED's 10M+ users. Kotlin, Jetpack Compose.",
        "is_remote": True,
        "source_url": "https://careers.cred.club",
        "job_id": "cred-android-blr-001",
        "posted_at": datetime.utcnow().isoformat(),
        "job_type": "Full-time",
        "salary_range": "₹20L - ₹40L",
        "experience_level": "3-5 years",
        "skills_required": ["Kotlin", "Android", "Jetpack Compose", "REST APIs"]
    },
    {
        "company": "Meesho",
        "role": "ML Engineer",
        "location": "Bengaluru, India",
        "description": "Build recommendation and ranking systems for India's largest social commerce platform.",
        "is_remote": False,
        "source_url": "https://meesho.io/careers",
        "job_id": "meesho-ml-blr-001",
        "posted_at": datetime.utcnow().isoformat(),
        "job_type": "Full-time",
        "salary_range": "₹22L - ₹45L",
        "experience_level": "1-3 years",
        "skills_required": ["Python", "PyTorch", "Spark", "Recommendation Systems"]
    },
    {
        "company": "Infosys",
        "role": "Java Developer",
        "location": "Pune, India",
        "description": "Develop enterprise Java applications for global clients. Spring Boot, Microservices.",
        "is_remote": False,
        "source_url": "https://www.infosys.com/careers",
        "job_id": "infy-java-pune-001",
        "posted_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
        "job_type": "Full-time",
        "salary_range": "₹8L - ₹15L",
        "experience_level": "0-1 years",
        "skills_required": ["Java", "Spring Boot", "SQL", "REST APIs"]
    },
    {
        "company": "Atlassian",
        "role": "Full Stack Engineer",
        "location": "Remote",
        "description": "Work on Jira, Confluence, and Trello. Fully remote role with global team.",
        "is_remote": True,
        "source_url": "https://www.atlassian.com/company/careers",
        "job_id": "atlassian-fse-remote-001",
        "posted_at": datetime.utcnow().isoformat(),
        "job_type": "Full-time",
        "salary_range": "$80K - $130K",
        "experience_level": "3-5 years",
        "skills_required": ["React", "Node.js", "PostgreSQL", "AWS", "TypeScript"]
    }
]

def seed():
    print(f"Connecting to: {SUPABASE_URL}")
    print(f"Seeding {len(SAMPLE_JOBS)} jobs...")
    
    try:
        res = client.table("jobs").upsert(SAMPLE_JOBS, on_conflict="job_id").execute()
        if res.data:
            print(f"✅ Successfully seeded {len(res.data)} jobs!")
            for job in res.data:
                print(f"  - {job.get('company')} | {job.get('role')} | {job.get('location')}")
        else:
            print("⚠️  Upsert returned no data. Check table schema.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    seed()

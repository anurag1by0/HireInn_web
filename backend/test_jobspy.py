"""Test JobSpy directly."""
import logging
import sys
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

print("Testing JobSpy...")
try:
    from jobspy import scrape_jobs
    print("Import OK, running scrape...")
    jobs = scrape_jobs(
        site_name=["indeed"],
        search_term="Software Engineer",
        location="India",
        results_wanted=3,
        country_indeed='India',
    )
    print(f"Got {len(jobs)} jobs")
    if len(jobs) > 0:
        print(jobs[['title', 'company', 'location']].head())
except Exception as e:
    import traceback
    print(f"FAILED: {e}")
    traceback.print_exc()

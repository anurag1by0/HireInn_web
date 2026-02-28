import { Job } from './dummyJobs';

/**
 * Multi-Provider Job Fetching Strategy:
 * 1. TheirStack (Primary - more reliable free tier)
 * 2. RapidAPI JSearch (Backup)
 * 3. Dummy Data (Fallback)
 */

export async function fetchJobs(query: string = 'Software Engineer'): Promise<Job[]> {
    // 1. Try TheirStack first (more reliable, better rate limits)
    const theirStackJobs = await fetchFromTheirStack(query);
    if (theirStackJobs && theirStackJobs.length > 0) {
        return theirStackJobs;
    }

    // 2. Fallback to RapidAPI JSearch
    const rapidApiJobs = await fetchFromRapidApi(query);
    if (rapidApiJobs && rapidApiJobs.length > 0) {
        return rapidApiJobs;
    }

    // 3. Ultimate fallback to dummy data
    console.warn("Both APIs failed. Using dummy data.");
    return import('./dummyJobs').then(m => m.dummyJobs);
}

async function fetchFromTheirStack(query: string): Promise<Job[] | null> {
    const THEIRSTACK_API_KEY = process.env.THEIRSTACK_API_KEY;
    if (!THEIRSTACK_API_KEY) {
        console.log("No THEIRSTACK_API_KEY, skipping TheirStack.");
        return null;
    }

    try {
        console.log("Fetching from TheirStack API...");
        const res = await fetch('https://api.theirstack.com/v1/jobs/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${THEIRSTACK_API_KEY}`
            },
            body: JSON.stringify({
                page: 0,
                limit: 20,
                job_title_or: [query],
                job_country_code_or: ["IN"], // India
                posted_at_max_age_days: 30
            }),
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            console.warn(`TheirStack API Error: ${res.status}`);
            return null;
        }

        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.data || []).map((j: any) => ({
            id: j.id || j.job_id || String(Math.random()),
            company: j.company_name || j.company?.name || 'Unknown Company',
            role: j.job_title || j.title || query,
            experience: '2-5 yrs',
            location: j.job_location || j.city || 'India',
            backgroundHint: getRandomGradient(),
            salary: j.salary_string || 'Not Disclosed',
            details: j.description ? j.description.slice(0, 250) + '...' : 'No details available.',
            applyLink: j.url || j.apply_url || '#'
        }));
    } catch (error) {
        console.error("TheirStack fetch failed:", error);
        return null;
    }
}

async function fetchFromRapidApi(query: string): Promise<Job[] | null> {
    const RAPID_API_KEY = process.env.RAPID_API_KEY;
    if (!RAPID_API_KEY) {
        console.log("No RAPID_API_KEY, skipping RapidAPI.");
        return null;
    }

    try {
        console.log("Fetching from RapidAPI JSearch...");
        const res = await fetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query + ' in India')}&num_pages=1`, {
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            },
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            if (res.status === 429) {
                console.warn("RapidAPI Rate Limit (429).");
            }
            return null;
        }

        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.data || []).map((j: any) => ({
            id: j.job_id,
            company: j.employer_name,
            role: j.job_title,
            experience: '2-5 yrs',
            location: j.job_city ? `${j.job_city}, ${j.job_country}` : 'Remote',
            backgroundHint: getRandomGradient(),
            salary: j.job_min_salary ? `₹${j.job_min_salary}-${j.job_max_salary}` : 'Not Disclosed',
            details: j.job_description ? j.job_description.slice(0, 200) + '...' : 'No details available.',
            applyLink: j.job_apply_link || j.job_google_link || '#'
        }));
    } catch (error) {
        console.error("RapidAPI fetch failed:", error);
        return null;
    }
}

function getRandomGradient() {
    const gradients = [
        'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
        'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        'linear-gradient(135deg, #fff1f2 0%, #fec3c8 100%)',
        'linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

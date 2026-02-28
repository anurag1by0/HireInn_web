import { NextResponse } from 'next/server';
import { Job } from '@/lib/dummyJobs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import JobModel from '@/models/Job';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = 12;

    // Get user profile for personalized matching
    let userProfile = null;
    try {
        const session = await getServerSession(authOptions);
        if (session) {
            const db = await dbConnect();
            if (db) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                userProfile = await User.findById((session.user as any).id).lean();
            }
        }
    } catch (e) {
        console.log("Could not fetch user profile:", e);
    }

    const jobs = await fetchJobsWithPagination(page, limit, userProfile);

    // Filter and score jobs based on user profile
    const scoredJobs = userProfile
        ? scoreAndFilterJobs(jobs, userProfile)
        : jobs;

    return NextResponse.json({
        jobs: scoredJobs,
        page,
        hasMore: jobs.length === limit
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scoreAndFilterJobs(jobs: Job[], profile: any): Job[] {
    const scored = jobs.map(job => {
        let score = 0;

        // Experience match (30 points)
        const jobExpMatch = job.experience.match(/(\d+)/);
        if (jobExpMatch) {
            const jobMinExp = parseInt(jobExpMatch[0]);
            if (profile.experience >= jobMinExp && profile.experience <= jobMinExp + 3) {
                score += 30;
            } else if (Math.abs(profile.experience - jobMinExp) <= 2) {
                score += 15;
            }
        }

        // Skills match (40 points)
        if (profile.skills && profile.skills.length > 0) {
            const jobSkills = [job.role, job.description].join(' ').toLowerCase();
            const matchedSkills = profile.skills.filter((skill: string) =>
                jobSkills.includes(skill.toLowerCase())
            );
            score += (matchedSkills.length / profile.skills.length) * 40;
        }

        // Location match (30 points)
        if (profile.preferredLocation && profile.preferredLocation !== 'Any') {
            if (job.location.includes(profile.preferredLocation)) {
                score += 30;
            } else if (job.location.includes('Remote')) {
                score += 20;
            }
        } else {
            score += 15; // Neutral score for "Any"
        }

        return { ...job, matchScore: score };
    });

    // If profile exists, sort by score. If filtered list is empty, return top scored jobs anyway (fallback)
    const filtered = scored.filter(job => (job.matchScore || 0) > 10); // Lower threshold to 10

    if (filtered.length === 0 && scored.length > 0) {
        // Fallback: return top 10 jobs even if low score, sorted by score
        return scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

async function fetchJobsWithPagination(page: number, limit: number, profile?: any): Promise<Job[]> {
    const { dummyJobs } = await import('@/lib/dummyJobs');

    const mongoJobs = await fetchFromMongoDB(page, limit);
    if (mongoJobs && mongoJobs.length > 0) {
        return mongoJobs;
    }

    const start = page * limit;
    const dummySlice = dummyJobs.slice(start, start + limit);

    if (dummySlice.length > 0) {
        return dummySlice;
    }

    // Fallbacks (External APIs) - keeping as secondary backfill
    const theirStackJobs = await fetchFromTheirStack(page, limit, profile);
    if (theirStackJobs && theirStackJobs.length > 0) {
        return theirStackJobs;
    }

    const rapidApiJobs = await fetchFromRapidApi(page, limit, profile);
    if (rapidApiJobs && rapidApiJobs.length > 0) {
        return rapidApiJobs;
    }

    return [];
}

async function fetchFromMongoDB(page: number, limit: number): Promise<Job[] | null> {
    try {
        await dbConnect();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jobs = await (JobModel as any).find({})
            .sort({ posted_at: -1 })
            .skip(page * limit)
            .limit(limit)
            .lean();

        if (!jobs || jobs.length === 0) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return jobs.map((j: any) => ({
            id: j.job_id || String(j._id),
            company: j.company,
            role: j.role,
            experience: j.experience || "Not specified",
            location: j.location,
            backgroundHint: getRandomGradient(),
            salary: j.salary || "Not Disclosed",
            description: j.description || j.details || "",
            qualification: j.qualification,
            isRemote: j.is_remote,
            type: j.type,
            details: j.description || "", // legacy mapping
            applyLink: j.url
        }));
    } catch (e) {
        console.error("MongoDB Fetch Error:", e);
        return null;
    }
}

async function fetchFromTheirStack(page: number, limit: number, profile?: any): Promise<Job[] | null> {
    const THEIRSTACK_API_KEY = process.env.THEIRSTACK_API_KEY;
    if (!THEIRSTACK_API_KEY) return null;

    // Use profile skills if available, otherwise default to software engineer keywords
    const searchTerms = (profile?.skills && profile?.skills.length > 0)
        ? profile.skills
        : ['Software Engineer', 'Developer', 'Frontend', 'Backend', 'Full Stack'];

    try {
        console.log(`TheirStack: Fetching page ${page} with terms: ${searchTerms.slice(0, 3)}...`);
        const res = await fetch('https://api.theirstack.com/v1/jobs/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${THEIRSTACK_API_KEY}`
            },
            body: JSON.stringify({
                page: page,
                limit: limit,
                job_title_or: searchTerms,
                job_country_code_or: ['IN'],
                posted_at_max_age_days: 30
            }),
            cache: 'no-store'
        });

        if (!res.ok) {
            console.warn(`TheirStack Error: ${res.status}`);
            return null;
        }

        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.data || []).map((j: any) => ({
            id: j.id || String(Math.random()),
            company: j.company_name || j.company?.name || 'Unknown',
            role: j.job_title || 'Software Engineer',
            experience: '2-5 yrs', // TheirStack doesn't always provide this cleanly
            location: j.job_location || j.city || 'India',
            backgroundHint: getRandomGradient(),
            salary: j.salary_string || 'Competitive',
            details: j.description ? j.description.slice(0, 500) : 'No description available.',
            description: j.description ? j.description.slice(0, 500) : 'No description available.',
            isRemote: j.remote || false, // Check API docs for real field
            type: 'Full-time', // Default
            applyLink: j.url || j.apply_url || '#'
        }));
    } catch (error) {
        console.error('TheirStack failed:', error);
        return null;
    }
}

async function fetchFromRapidApi(page: number, limit: number, profile?: any): Promise<Job[] | null> {
    const RAPID_API_KEY = process.env.RAPID_API_KEY;
    if (!RAPID_API_KEY) return null;

    // Construct query from profile
    let query = 'Software Engineer in India';
    if (profile) {
        const title = profile.skills?.[0] || 'Software Engineer';
        const location = (profile.preferredLocation && profile.preferredLocation !== 'Any')
            ? profile.preferredLocation
            : 'India';
        query = `${title} in ${location}`;
    }

    try {
        console.log(`RapidAPI: Fetching page ${page} query: ${query}...`);
        const res = await fetch(
            `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=${page + 1}&num_pages=1`,
            {
                headers: {
                    'X-RapidAPI-Key': RAPID_API_KEY,
                    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
                },
                cache: 'no-store'
            }
        );

        if (!res.ok) {
            if (res.status === 429) console.warn('RapidAPI Rate Limited');
            return null;
        }

        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.data || []).slice(0, limit).map((j: any) => ({
            id: j.job_id,
            company: j.employer_name,
            role: j.job_title,
            experience: '2-5 yrs',
            location: j.job_city ? `${j.job_city}, ${j.job_country}` : 'Remote',
            backgroundHint: getRandomGradient(),
            salary: j.job_min_salary ? `₹${j.job_min_salary}-${j.job_max_salary}` : 'Not Disclosed',
            description: j.job_description ? j.job_description.slice(0, 500) : 'No description.',
            isRemote: j.job_is_remote_work_from_home,
            type: j.job_employment_type,
            details: j.job_description ? j.job_description.slice(0, 500) : 'No description.',
            applyLink: j.job_apply_link || j.job_google_link || '#'
        }));
    } catch (error) {
        console.error('RapidAPI failed:', error);
        return null;
    }
}

function getRandomGradient() {
    const gradients = [
        'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
        'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        'linear-gradient(135deg, #fff1f2 0%, #fecaca 100%)',
        'linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)',
        'linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%)',
        'linear-gradient(135deg, #ecfeff 0%, #a5f3fc 100%)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

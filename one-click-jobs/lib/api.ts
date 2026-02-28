import { getSession } from "next-auth/react";

export const API_URL = "http://localhost:8000/api";

export interface Job {
    id: string;
    job_id: string;
    company: string;
    role: string;
    location: string;
    is_remote: boolean;
    type: string;
    experience: string;
    salary?: string;
    posted_at?: string;
    description?: string;
    url?: string;
    // Personalized fields
    match_score?: number;
    match_percentage?: string;
    match_reason?: string;
    matching_skills?: string[];
}

export interface JobsResponse {
    jobs: Job[];
    total: number;
    has_more: boolean;
    filters_applied?: any;
}

export async function fetchPublicJobs(
    limit: number = 30,
    skip: number = 0,
    filters: { location?: string; remote_only?: boolean; search?: string; search_type?: string; experience?: number } = {}
): Promise<JobsResponse> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString()
    });

    if (filters.location) params.append('location', filters.location);
    if (filters.remote_only) params.append('remote_only', 'true');
    if (filters.search) params.append('search', filters.search);
    if (filters.search_type) params.append('search_type', filters.search_type);
    if (filters.experience !== undefined) params.append('experience', filters.experience.toString());

    const res = await fetch(`${API_URL}/jobs/public?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
}

export async function fetchPersonalizedJobs(
    token: string,
    limit: number = 20,
    skip: number = 0,
    search?: string,
    searchType?: string
): Promise<JobsResponse> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString()
    });
    if (search) params.append('search', search);
    if (searchType) params.append('search_type', searchType);

    const res = await fetch(`${API_URL}/jobs/personalized?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Failed to fetch personalized jobs');
    return res.json();
}

export async function fetchJobDetails(id: string): Promise<Job> {
    const res = await fetch(`${API_URL}/jobs/public/${id}`);
    if (!res.ok) throw new Error('Failed to fetch job details');
    const data = await res.json();
    return data.job;
}

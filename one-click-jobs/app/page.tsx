'use client';

import { useState, useEffect, useCallback } from 'react';
import JobCard from '@/components/JobCard';
import JobModal from '@/components/JobModal';
import { Loader2, Briefcase, ChevronDown, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Job, fetchPublicJobs, fetchPersonalizedJobs } from '@/lib/api';

const PAGE_SIZE = 30;

export default function Home() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [userExperience, setUserExperience] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTypeInput, setSearchTypeInput] = useState('all');

  // Fetch user profile experience when logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const token = (session as any).accessToken || (session as any).user?.accessToken || '';
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        fetch(`${apiUrl}/auth/profile/status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.experience_years !== undefined && data.experience_years !== null) {
              setUserExperience(parseInt(data.experience_years));
            }
          })
          .catch(() => { /* ignore */ });
      }
    }
  }, [session, status]);

  const loadJobs = useCallback(async (reset = false) => {
    const currentSkip = reset ? 0 : skip;
    if (reset) {
      setIsLoading(true);
      setJobs([]);
      setSkip(0);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let data;
      const appliedSearchType = searchType !== 'all' ? searchType : undefined;
      if (status === 'authenticated' && session?.user) {
        const token = (session as any).accessToken || (session as any).user?.accessToken || '';
        if (token) {
          try {
            data = await fetchPersonalizedJobs(token, PAGE_SIZE, currentSkip, searchQuery, appliedSearchType);
          } catch {
            // Personalized failed (profile not ready?), fall back to public with experience filter
            data = await fetchPublicJobs(PAGE_SIZE, currentSkip, { experience: userExperience, search: searchQuery, search_type: appliedSearchType });
          }
        } else {
          data = await fetchPublicJobs(PAGE_SIZE, currentSkip, { experience: userExperience, search: searchQuery, search_type: appliedSearchType });
        }
      } else {
        data = await fetchPublicJobs(PAGE_SIZE, currentSkip, { search: searchQuery, search_type: appliedSearchType });
      }

      const newJobs = data.jobs || [];
      setTotalJobs(data.total || 0);
      setHasMore(data.has_more || false);

      if (reset) {
        setJobs(newJobs);
        setSkip(PAGE_SIZE);
      } else {
        setJobs(prev => [...prev, ...newJobs]);
        setSkip(prev => prev + PAGE_SIZE);
      }
    } catch (e) {
      console.error('Failed to fetch jobs', e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [session, status, skip, userExperience, searchQuery, searchType]);

  // Initial load and reload when session, experience, or search changes
  useEffect(() => {
    loadJobs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userExperience, searchQuery, searchType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setSearchType(searchTypeInput);
  };

  return (
    <div className="min-h-screen bg-[#1e293b] pb-20 pt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8">

        {/* Search Bar */}
        <div className="mb-4">
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  searchTypeInput === 'company' ? 'Search by company (e.g. Google)...' :
                    searchTypeInput === 'role' ? 'Search by role (e.g. Developer)...' :
                      searchTypeInput === 'skill' ? 'Search by skill (e.g. React)...' :
                        'Search jobs by keyword...'
                }
                className="w-full bg-[#1e2d3d] border border-slate-600 text-slate-100 placeholder-slate-400 rounded-full py-3.5 pl-12 pr-24 focus:outline-none focus:border-blue-500 hover:border-slate-500 transition-colors shadow-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full text-sm transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-sm font-medium text-slate-400">Filter by:</span>
          {['company', 'role', 'skill'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                const newType = searchTypeInput === type ? 'all' : type;
                setSearchTypeInput(newType);
                setSearchType(newType); // Apply filter immediately
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${searchTypeInput === type
                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                : 'bg-[#1e2d3d] text-slate-300 border-slate-600 hover:bg-[#2d3b4e] hover:border-slate-500'
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Feed Header with count */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">
            {status === 'authenticated' ? 'Recommended for You' : 'Latest Opportunities'}
          </h2>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            {isLoading ? (
              'Loading jobs...'
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-emerald-400">{totalJobs.toLocaleString()} jobs</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  {status === 'authenticated'
                    ? 'Matched to your profile'
                    : 'From Indeed & LinkedIn · Updated live'}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Job Grid — 3 columns on large screens */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
            <p className="text-slate-500 text-sm">Fetching opportunities...</p>
          </div>
        ) : jobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job, idx) => (
                <div
                  key={job.id || job.job_id || idx}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${Math.min(idx, 10) * 0.04}s` }}
                >
                  <JobCard
                    job={job}
                    showMatchScore={status === 'authenticated'}
                    onClick={() => setSelectedJob(job)}
                  />
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="pt-6 pb-8 flex justify-center">
                <button
                  onClick={() => loadJobs(false)}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1e2d3d] hover:bg-[#243447] border border-slate-600 hover:border-slate-500 text-slate-200 font-semibold rounded-xl transition-all disabled:opacity-60 shadow-sm"
                >
                  {isLoadingMore ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Load More ({totalJobs - jobs.length} remaining)</>
                  )}
                </button>
              </div>
            )}

            {!hasMore && jobs.length > 0 && (
              <p className="text-center text-slate-600 text-sm py-6">
                You&apos;ve seen all {jobs.length} jobs — check back soon for new listings!
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-24 bg-[#1e2d3d] rounded-xl border border-dashed border-slate-600">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400">No jobs found</h3>
            <p className="text-slate-600 max-w-xs mx-auto mt-2 text-sm">
              The scraper is running — check back in a minute!
            </p>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}

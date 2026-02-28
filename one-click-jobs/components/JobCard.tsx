'use client';

import { Job } from '@/lib/api';
import { MapPin, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { saveAppliedJob } from './ProfileSidebar';

interface JobCardProps {
    job: Job;
    onClick?: () => void;
    onApply?: (jobId: string) => void;
    showMatchScore?: boolean;
}

// Derive a consistent avatar color from company name
function getAvatarColor(name: string): string {
    const colors = [
        'bg-blue-100 text-blue-700',
        'bg-emerald-100 text-emerald-700',
        'bg-violet-100 text-violet-700',
        'bg-amber-100 text-amber-700',
        'bg-rose-100 text-rose-700',
        'bg-cyan-100 text-cyan-700',
        'bg-indigo-100 text-indigo-700',
        'bg-orange-100 text-orange-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

// Format posted date as relative string
function formatRelativeDate(dateStr?: string): string {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

// Get source name from URL
function getSource(url?: string): string {
    if (!url) return '';
    if (url.includes('indeed')) return 'Indeed';
    if (url.includes('linkedin')) return 'LinkedIn';
    if (url.includes('glassdoor')) return 'Glassdoor';
    if (url.includes('naukri')) return 'Naukri';
    return '';
}

// Format location: "KA, IN" -> "Karnataka, India"  
const STATE_MAP: Record<string, string> = {
    'KA': 'Karnataka', 'MH': 'Maharashtra', 'TN': 'Tamil Nadu',
    'DL': 'Delhi', 'GJ': 'Gujarat', 'TS': 'Telangana',
    'AP': 'Andhra Pradesh', 'WB': 'West Bengal', 'RJ': 'Rajasthan',
    'HR': 'Haryana', 'UP': 'Uttar Pradesh', 'PB': 'Punjab',
};
function formatLocation(loc?: string): string {
    if (!loc) return 'India';
    const parts = loc.split(',').map(s => s.trim());
    if (parts.length === 2 && parts[1] === 'IN') {
        const state = STATE_MAP[parts[0]] || parts[0];
        return `${state}, India`;
    }
    return loc;
}

export default function JobCard({ job, onClick, showMatchScore = false }: JobCardProps) {
    const avatarColor = getAvatarColor(job.company || '');
    const source = getSource(job.url || job.job_id);
    const jobUrl = job.url || job.job_id || '#';

    const handleApply = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Save to applied jobs list
        saveAppliedJob({
            id: job.id || job.job_id || '',
            role: job.role,
            company: job.company,
            url: jobUrl,
        });
        window.open(jobUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="relative w-full h-full bg-[#1e2d3d] border border-slate-700 rounded-xl p-5 hover:border-slate-500 hover:bg-[#243447] transition-all cursor-pointer group shadow-sm flex flex-col"
            onClick={onClick}
        >
            {/* Top: Avatar + Title */}
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor}`}>
                    {(job.company || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
                        {job.role}
                    </h3>
                    <p className="text-slate-400 text-xs font-medium flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{job.company}</span>
                    </p>
                </div>
            </div>

            {/* Description snippet */}
            {job.description && (
                <p className="text-slate-400 text-xs mt-1 mb-3 leading-relaxed line-clamp-2">
                    {job.description}
                </p>
            )}

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-auto mb-3">
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" />
                    {formatLocation(job.location)}
                </span>
                <span className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {formatRelativeDate(job.posted_at)}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {job.is_remote && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                        Remote
                    </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300">
                    {(!job.type || job.type === 'nan') ? 'Full-time' : job.type}
                </span>
                {source && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-400">
                        via {source}
                    </span>
                )}
                {showMatchScore && job.match_percentage && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                        {job.match_percentage} match
                    </span>
                )}
            </div>

            {/* Matching skills badges */}
            {showMatchScore && job.matching_skills && job.matching_skills.length > 0 && (
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                        {job.matching_skills.slice(0, 4).map((skill, i) => (
                            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-900/40 text-green-300 border border-green-800/40">
                                {skill}
                            </span>
                        ))}
                        {job.matching_skills.length > 4 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-400">
                                +{job.matching_skills.length - 4}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Match reason */}
            {showMatchScore && job.match_reason && job.match_reason !== 'Available position' && (
                <p className="text-xs text-slate-400 mb-3 italic">{job.match_reason}</p>
            )}

            {/* Apply button at bottom */}
            <button
                onClick={handleApply}
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm mt-auto"
            >
                Apply <ExternalLink className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

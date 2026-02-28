'use client';

import { Job } from '@/lib/api';
import { X, MapPin, Briefcase, ExternalLink, Calendar, Building2, Globe } from 'lucide-react';

interface JobModalProps {
    job: Job;
    onClose: () => void;
}

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

function formatDate(dateStr?: string): string {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getSource(url?: string): string {
    if (!url) return 'Job Board';
    if (url.includes('indeed')) return 'Indeed';
    if (url.includes('linkedin')) return 'LinkedIn';
    if (url.includes('glassdoor')) return 'Glassdoor';
    if (url.includes('naukri')) return 'Naukri';
    return 'Job Board';
}

function getAvatarColor(name: string): string {
    const colors = [
        'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
        'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export default function JobModal({ job, onClose }: JobModalProps) {
    const jobUrl = job.url || job.job_id || '#';
    const source = getSource(job.url || job.job_id);
    const avatarColor = getAvatarColor(job.company || '');

    const handleApply = () => {
        window.open(jobUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-[#1a2535] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ring-1 ring-slate-700 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#1e2d3d] border-b border-slate-700 p-6 flex items-start gap-4 shrink-0">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white shrink-0 ${avatarColor}`}>
                        {(job.company || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-white leading-tight">{job.role}</h2>
                        <p className="text-slate-300 font-medium mt-0.5 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 shrink-0" />
                            {job.company}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {job.is_remote && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">Remote</span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">{job.type || 'Full-time'}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs text-slate-400 bg-slate-800">via {source}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Info grid */}
                <div className="px-6 pt-5 grid grid-cols-3 gap-3 shrink-0">
                    <div className="bg-[#243447] border border-slate-700 rounded-xl p-3 text-center">
                        <MapPin className="w-4 h-4 mx-auto mb-1.5 text-slate-400" />
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Location</p>
                        <p className="text-sm font-semibold text-slate-200">{formatLocation(job.location)}</p>
                    </div>
                    <div className="bg-[#243447] border border-slate-700 rounded-xl p-3 text-center">
                        <Briefcase className="w-4 h-4 mx-auto mb-1.5 text-slate-400" />
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Type</p>
                        <p className="text-sm font-semibold text-slate-200">{job.type || 'Full-time'}</p>
                    </div>
                    <div className="bg-[#243447] border border-slate-700 rounded-xl p-3 text-center">
                        <Calendar className="w-4 h-4 mx-auto mb-1.5 text-slate-400" />
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Posted</p>
                        <p className="text-sm font-semibold text-slate-200">{formatDate(job.posted_at)}</p>
                    </div>
                </div>

                {/* Description */}
                <div className="px-6 py-5 overflow-y-auto flex-1">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">About the Role</h3>
                    <div className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap">
                        {job.description || 'No description provided. Click "Apply on Job Board" below to see the full listing.'}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-700 bg-[#1e2d3d] p-4 flex gap-3 shrink-0">
                    <button
                        onClick={handleApply}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Apply on {source}
                    </button>
                    <a
                        href={jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Globe className="w-4 h-4" />
                        View Listing
                    </a>
                </div>
            </div>
        </div>
    );
}

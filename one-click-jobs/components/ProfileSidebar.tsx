'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Save, Loader2, ExternalLink, Trash2, Briefcase, Settings2 } from 'lucide-react';

interface AppliedJob {
    id: string;
    role: string;
    company: string;
    url: string;
    appliedAt: string;
}

interface ProfileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    session: any;
}

const LOCATION_OPTIONS = [
    'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi NCR', 'Pune', 'Chennai',
    'Kolkata', 'Noida', 'Gurugram', 'Remote', 'Other'
];

const ROLE_OPTIONS = [
    'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer',
    'DevOps Engineer', 'Data Scientist', 'Mobile Developer',
    'QA Engineer', 'Product Manager', 'UI/UX Designer',
    'Data Analyst', 'Machine Learning Engineer', 'Cloud Engineer',
    'Security Engineer', 'Business Analyst', 'Other'
];

// LocalStorage helpers for applied jobs
export function getAppliedJobs(): AppliedJob[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem('hireinn_applied_jobs') || '[]');
    } catch { return []; }
}

export function saveAppliedJob(job: { id: string; role: string; company: string; url: string }) {
    const jobs = getAppliedJobs();
    if (jobs.some(j => j.id === job.id)) return; // Already saved
    jobs.unshift({ ...job, appliedAt: new Date().toISOString() });
    localStorage.setItem('hireinn_applied_jobs', JSON.stringify(jobs.slice(0, 100)));
}

export function removeAppliedJob(jobId: string) {
    const jobs = getAppliedJobs().filter(j => j.id !== jobId);
    localStorage.setItem('hireinn_applied_jobs', JSON.stringify(jobs));
}

export default function ProfileSidebar({ isOpen, onClose, session }: ProfileSidebarProps) {
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('');
    const [resume, setResume] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
    const [profileLoading, setProfileLoading] = useState(true);
    const [currentSkills, setCurrentSkills] = useState<string[]>([]);
    const [experience, setExperience] = useState<number>(0);

    const token = session?.accessToken || session?.user?.accessToken || '';

    // Load profile data and applied jobs when sidebar opens
    useEffect(() => {
        if (isOpen && token) {
            setProfileLoading(true);
            fetch('http://localhost:8000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : null)
                .then(async (userData) => {
                    if (userData) {
                        // Fetch full profile
                        const profRes = await fetch('http://localhost:8000/api/auth/profile/status', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (profRes.ok) {
                            const prof = await profRes.json();
                            setRole(prof.preferred_role || '');
                            setLocation(prof.preferred_location || '');
                            setExperience(prof.experience_years || 0);
                            setCurrentSkills(prof.skills || []);
                        }
                    }
                })
                .catch(() => { })
                .finally(() => setProfileLoading(false));

            setAppliedJobs(getAppliedJobs());
        }
    }, [isOpen, token]);

    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        setSaved(false);

        try {
            const formData = new FormData();
            formData.append('preferred_role', role);
            formData.append('preferred_location', location);
            if (resume) {
                formData.append('resume', resume);
            }

            const res = await fetch('http://localhost:8000/api/auth/profile/update', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                setSaved(true);
                setResume(null);
                setTimeout(() => setSaved(false), 3000);
                // Reload page to refresh matches
                window.location.reload();
            }
        } catch (e) {
            console.error('Failed to update profile', e);
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveJob = (jobId: string) => {
        removeAppliedJob(jobId);
        setAppliedJobs(getAppliedJobs());
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-[380px] max-w-[90vw] bg-[#1a2534] border-r border-slate-700 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } flex flex-col`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-blue-400" />
                        Profile
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Manage Filters Section */}
                    <div className="p-4 border-b border-slate-700/50">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Manage Filters
                        </h3>

                        {profileLoading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Preferred Role */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Role</label>
                                    <select
                                        value={role}
                                        onChange={e => setRole(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Select role...</option>
                                        {ROLE_OPTIONS.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Preferred Location */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Location</label>
                                    <select
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Select location...</option>
                                        {LOCATION_OPTIONS.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Resume Upload */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Update Resume</label>
                                    <label className={`flex items-center gap-2 w-full bg-slate-800 border border-dashed ${resume ? 'border-emerald-500' : 'border-slate-600'} rounded-lg px-3 py-2 cursor-pointer hover:border-blue-500 transition-colors`}>
                                        <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="text-sm text-slate-400 truncate">
                                            {resume ? resume.name : 'Upload new PDF/DOCX'}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".pdf,.docx,.doc"
                                            className="hidden"
                                            onChange={e => setResume(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </div>

                                {/* Current Skills (read-only) */}
                                {currentSkills.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
                                            Extracted Skills ({currentSkills.length})
                                        </label>
                                        <div className="flex flex-wrap gap-1">
                                            {currentSkills.slice(0, 12).map((skill, i) => (
                                                <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-900/30 text-green-300 border border-green-800/30">
                                                    {skill}
                                                </span>
                                            ))}
                                            {currentSkills.length > 12 && (
                                                <span className="text-[10px] text-slate-500">+{currentSkills.length - 12} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {saving ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                    ) : saved ? (
                                        <><Save className="w-4 h-4" /> Saved!</>
                                    ) : (
                                        <><Save className="w-4 h-4" /> Save Changes</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Applied Jobs Section */}
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" />
                            Applied Jobs ({appliedJobs.length})
                        </h3>

                        {appliedJobs.length === 0 ? (
                            <div className="text-center py-8">
                                <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No applied jobs yet</p>
                                <p className="text-xs text-slate-600 mt-1">Jobs you apply to will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {appliedJobs.map(job => (
                                    <div
                                        key={job.id}
                                        className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 group hover:border-slate-600 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-white truncate">{job.role}</p>
                                                <p className="text-xs text-slate-400">{job.company}</p>
                                                <p className="text-[10px] text-slate-500 mt-1">
                                                    Applied {new Date(job.appliedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <a
                                                    href={job.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors"
                                                    title="Open job listing"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <button
                                                    onClick={() => handleRemoveJob(job.id)}
                                                    className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

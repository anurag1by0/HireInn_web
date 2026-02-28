'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sparkles, Briefcase, MapPin, Upload, Loader2, Code } from 'lucide-react';

const LOCATIONS = [
    'Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi NCR',
    'Chennai', 'Kolkata', 'Noida', 'Gurugram', 'Remote'
];

const ROLES = [
    'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer',
    'DevOps Engineer', 'Data Scientist', 'Mobile Developer',
    'QA Engineer', 'Product Manager', 'UI/UX Designer',
    'Data Analyst', 'Machine Learning Engineer', 'Cloud Engineer',
    'Security Engineer', 'Business Analyst', 'Other'
];

export default function Onboarding() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [preferredRole, setPreferredRole] = useState('');
    const [locations, setLocations] = useState<string[]>([]);
    const [resume, setResume] = useState<File | null>(null);

    const toggleLocation = (loc: string) => {
        setLocations(prev =>
            prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
        );
    };

    const handleSubmit = async () => {
        const token = (session as any)?.accessToken || (session as any)?.user?.accessToken;
        if (!token) return;

        setLoading(true);
        try {
            const formData = new FormData();
            if (preferredRole) formData.append('preferred_role', preferredRole);
            if (locations.length > 0) formData.append('preferred_location', locations.join(', '));
            if (resume) formData.append('resume', resume);

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${apiUrl}/auth/profile/update`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                console.error("Failed backend update", await res.text());
            }
        } catch (error) {
            console.error('Onboarding failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>;
    }

    if (status === 'unauthenticated') {
        router.push('/auth/signin');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        Let's personalize your experience
                    </div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">
                        Welcome to HireInn
                    </h1>
                    <p className="text-slate-400">
                        Upload your resume to instantly match with top-paying tier companies
                    </p>
                </div>

                {/* Progress */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`h-2 flex-1 rounded-full transition-all ${i <= step
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                : 'bg-slate-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-[#1a1a2e] border border-slate-700 rounded-2xl p-8 shadow-2xl">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center gap-2 text-slate-300 mb-4 font-medium">
                                    <Upload className="w-5 h-5" />
                                    Upload Resume (Important)
                                </label>
                                <p className="text-sm text-slate-500 mb-6 font-medium">
                                    Our AI automatically extracts your entire experience, skills, and projects in seconds so you don't have to fill anything manually.
                                </p>
                                <label className={`flex flex-col items-center justify-center w-full h-48 bg-slate-900/50 border-2 border-dashed ${resume ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-600'} rounded-xl cursor-pointer hover:border-blue-500 transition-colors`}>
                                    {resume ? (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                                                <Code className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <p className="text-emerald-400 font-semibold">{resume.name}</p>
                                            <p className="text-xs text-slate-500 mt-2">Click to replace</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                                                <Upload className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-300 font-medium">Drop your PDF or DOCX</p>
                                            <p className="text-xs text-slate-500 mt-2">Maximum file size 5MB</p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.doc"
                                        className="hidden"
                                        onChange={e => setResume(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <label className="flex items-center gap-2 text-slate-300 mb-4 font-medium">
                                <Briefcase className="w-5 h-5" />
                                What's your target role?
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {ROLES.map(role => (
                                    <button
                                        key={role}
                                        onClick={() => setPreferredRole(role)}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${preferredRole === role
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-lg'
                                            : 'bg-slate-900/30 border-slate-600 text-slate-300 hover:border-slate-500'
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <label className="flex items-center gap-2 text-slate-300 mb-2 font-medium">
                                <MapPin className="w-5 h-5" />
                                Select Preferred Locations
                            </label>
                            <p className="text-sm text-slate-500 mb-4">
                                You can select multiple locations. This heavily impacts your matches.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {LOCATIONS.map(loc => (
                                    <button
                                        key={loc}
                                        onClick={() => toggleLocation(loc)}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${locations.includes(loc)
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-lg'
                                            : 'bg-slate-900/30 border-slate-600 text-slate-300 hover:border-slate-500'
                                            }`}
                                    >
                                        {loc}
                                        {locations.includes(loc) && <span className="float-right">✓</span>}
                                    </button>
                                ))}
                            </div>
                            <p className="text-slate-500 text-sm mt-4">
                                Selected: {locations.length} locations
                            </p>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3 mt-10">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium border border-slate-700"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={() => step === 3 ? handleSubmit() : setStep(step + 1)}
                            disabled={loading}
                            className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold transition-all ${loading ? 'opacity-50 cursor-not-allowed bg-slate-700' :
                                'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20'
                                }`}
                        >
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Saving...</> : step === 3 ? 'Complete Setup' : 'Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

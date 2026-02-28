'use client';

import { useState } from 'react';
import { X, UploadCloud, CheckCircle, ArrowRight, Loader2, Briefcase } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface QuickSignupModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobTitle?: string;
    onSuccess: (token: string, user: any) => void;
}

const EXPERIENCE_OPTIONS = [
    { value: "0-1", label: "0-1 years (Fresher)" },
    { value: "1-3", label: "1-3 years (Junior)" },
    { value: "3-5", label: "3-5 years (Mid-level)" },
    { value: "5-8", label: "5-8 years (Senior)" },
    { value: "8-12", label: "8-12 years (Lead)" },
    { value: "12+", label: "12+ years (Principal)" }
];

const COMMON_ROLES = [
    "Backend Engineer", "Frontend Engineer", "Full Stack Engineer",
    "DevOps Engineer", "Data Scientist", "Mobile Developer",
    "QA Engineer", "Product Manager", "UI/UX Designer"
];

export default function QuickSignupModal({ isOpen, onClose, jobTitle, onSuccess }: QuickSignupModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Step 2: Profile
    const [resume, setResume] = useState<File | null>(null);
    const [experience, setExperience] = useState('');
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('Remote');

    if (!isOpen) return null;

    const handleCredentialsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || password.length < 8) {
            setError('Please provide a valid email and password (min 8 chars)');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSignup = async () => {
        if (!resume || !experience || !role) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            formData.append('resume', resume);
            formData.append('experience_years', experience);
            formData.append('preferred_role', role);
            formData.append('preferred_location', location);

            const res = await fetch('http://localhost:8000/api/auth/quick-signup', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || 'Signup failed');
            }

            // Automatically sign in via NextAuth
            const signInRes = await signIn('credentials', {
                email,
                password,
                redirect: false
            });

            if (signInRes?.error) {
                throw new Error('Account created but login failed. Please log in manually.');
            }

            // Success
            if (onSuccess) onSuccess(data.access_token, data.user);
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="px-8 pt-8 pb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {jobTitle ? `Apply to ${jobTitle}` : 'Create your account'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {step === 1 ? 'Start with your credentials' : 'Tell us about your experience'}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: step === 1 ? '50%' : '100%' }}
                    />
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Min 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>

                            <p className="text-center text-xs text-slate-400 mt-4">
                                Already have an account? <button type="button" className="text-blue-600 hover:underline">Log in</button>
                            </p>
                        </form>
                    ) : (
                        <div className="space-y-5">

                            {/* Resume Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Resume</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.doc"
                                        onChange={(e) => setResume(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="resume-upload"
                                    />
                                    <label
                                        htmlFor="resume-upload"
                                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${resume ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                                            }`}
                                    >
                                        {resume ? (
                                            <div className="flex items-center gap-2 text-green-700">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="text-sm font-medium truncate max-w-[200px]">{resume.name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-slate-400">
                                                <UploadCloud className="w-6 h-6" />
                                                <span className="text-xs">Upload PDF or DOCX</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Experience</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                        value={experience}
                                        onChange={(e) => setExperience(e.target.value)}
                                    >
                                        <option value="">Select Level</option>
                                        {EXPERIENCE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Role</label>
                                    <input
                                        type="text"
                                        list="roles-list"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Backend Engineer"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    />
                                    <datalist id="roles-list">
                                        {COMMON_ROLES.map(r => <option key={r} value={r} />)}
                                    </datalist>
                                </div>
                            </div>

                            <button
                                onClick={handleSignup}
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account & Apply'}
                            </button>

                            <button
                                onClick={() => setStep(1)}
                                className="w-full text-slate-500 text-sm hover:text-slate-700"
                            >
                                Back to Credentials
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

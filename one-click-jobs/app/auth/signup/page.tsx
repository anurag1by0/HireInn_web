'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import Link from 'next/link';

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

export default function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [location, setLocation] = useState('');
    const [experience, setExperience] = useState<number>(0);
    const [role, setRole] = useState('');
    const [resume, setResume] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            setLoading(false);
            return;
        }
        if (!resume) {
            setError('Please upload your resume.');
            setLoading(false);
            return;
        }

        try {
            // Build FormData for backend
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            formData.append('resume', resume);
            formData.append('experience_years', experience.toString());
            formData.append('preferred_role', role);
            formData.append('preferred_location', location);
            formData.append('name', name);

            const res = await fetch('http://localhost:8000/api/auth/quick-signup', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || 'Sign up failed. Please try again.');
                setLoading(false);
                return;
            }

            setSuccess(true);

            // Now sign in with the credentials to create a next-auth session
            const signInRes = await signIn('credentials', {
                email,
                password,
                redirect: false,
                callbackUrl: '/',
            });

            if (signInRes?.error) {
                // Account created but auto sign-in failed
                setError('Account created! But auto sign-in failed. Please sign in manually.');
                setLoading(false);
                return;
            }

            // Redirect to home
            window.location.href = '/';
        } catch {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1e293b] flex items-center justify-center p-4 pt-20">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        <span className="text-blue-300">Hire</span>
                        <span className="text-green-300">Inn</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">Create your account to get personalized job matches</p>
                </div>

                <div className="bg-[#2d3f55] rounded-2xl shadow-2xl border border-slate-700 p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Sign Up</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-emerald-900/30 border border-emerald-700 text-emerald-300 text-sm rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Account created! Signing you in...
                            </div>
                        )}

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit"
                                className="w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Location & Experience row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                                <select
                                    required
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Select...</option>
                                    {LOCATION_OPTIONS.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Experience (years)</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    max={30}
                                    value={experience}
                                    onChange={e => setExperience(parseInt(e.target.value) || 0)}
                                    placeholder="e.g. 2"
                                    className="w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Profile / Role</label>
                            <select
                                required
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                            >
                                <option value="">Select your role...</option>
                                {ROLE_OPTIONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        {/* Resume Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Resume</label>
                            <label
                                className={`flex items-center gap-3 w-full bg-slate-800 border border-dashed ${resume ? 'border-emerald-500' : 'border-slate-600'} rounded-lg px-4 py-3 cursor-pointer hover:border-blue-500 transition-colors`}
                            >
                                {resume ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                                        <span className="text-emerald-300 text-sm truncate">{resume.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 text-slate-400 shrink-0" />
                                        <span className="text-slate-400 text-sm">Upload PDF or DOCX</span>
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

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                            ) : success ? (
                                <><CheckCircle className="w-4 h-4" /> Redirecting...</>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-xs mt-6">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

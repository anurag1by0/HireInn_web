'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
    const [providers, setProviders] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getProviders().then(setProviders);
    }, []);

    const handleCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
            callbackUrl: '/'
        });
        setLoading(false);
        if (res?.error) {
            setError('Invalid email or password.');
        } else if (res?.url) {
            window.location.href = res.url;
        }
    };

    return (
        <div className="min-h-screen bg-[#1e293b] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        <span className="text-blue-300">Hire</span>
                        <span className="text-green-300">Inn</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">Sign in to access personalized job matches</p>
                </div>

                <div className="bg-[#2d3f55] rounded-2xl shadow-2xl border border-slate-700 p-8">
                    {/* Google Sign In */}
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm border border-gray-200 mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-[#2d3f55] text-slate-400">or sign in with email</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleCredentials} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-lg">
                                {error}
                            </div>
                        )}
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
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-xs mt-6">
                        Don&apos;t have an account?{' '}
                        <a
                            href="/auth/signup"
                            className="text-blue-400 hover:text-blue-300"
                        >
                            Sign Up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Briefcase, MapPin, Code } from 'lucide-react';

const POPULAR_SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
    'Go', 'Rust', 'C++', 'SQL', 'MongoDB', 'PostgreSQL',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'System Design', 'DSA'
];

const EXPERIENCE_LEVELS = [
    { value: 0, label: 'Fresher (0 yrs)' },
    { value: 1, label: '1-2 years' },
    { value: 3, label: '3-5 years' },
    { value: 5, label: '5+ years' }
];

const LOCATIONS = [
    'Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi/NCR',
    'Chennai', 'Remote', 'Any'
];

export default function Onboarding() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        experience: 0,
        skills: [] as string[],
        preferredLocation: 'Any'
    });

    const toggleSkill = (skill: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    onboardingComplete: true
                })
            });

            if (res.ok) {
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            console.error('Onboarding failed:', error);
        } finally {
            setLoading(false);
        }
    };

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
                        Tell us about yourself
                    </h1>
                    <p className="text-slate-400">
                        We'll match you with the perfect opportunities
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
                                <label className="flex items-center gap-2 text-slate-300 mb-2 font-medium">
                                    <Briefcase className="w-4 h-4" />
                                    What's your name?
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-slate-300 mb-2 font-medium">
                                    <Briefcase className="w-4 h-4" />
                                    Experience Level
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {EXPERIENCE_LEVELS.map(exp => (
                                        <button
                                            key={exp.value}
                                            onClick={() => setFormData({ ...formData, experience: exp.value })}
                                            className={`p-3 rounded-xl border transition-all ${formData.experience === exp.value
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white'
                                                    : 'bg-slate-900/30 border-slate-600 text-slate-300 hover:border-slate-500'
                                                }`}
                                        >
                                            {exp.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-slate-300 mb-2 font-medium">
                                <Code className="w-4 h-4" />
                                Select your skills
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {POPULAR_SKILLS.map(skill => (
                                    <button
                                        key={skill}
                                        onClick={() => toggleSkill(skill)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formData.skills.includes(skill)
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                                : 'bg-slate-900/30 border border-slate-600 text-slate-300 hover:border-slate-500'
                                            }`}
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                            <p className="text-slate-500 text-sm">
                                Selected: {formData.skills.length} skills
                            </p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-slate-300 mb-2 font-medium">
                                <MapPin className="w-4 h-4" />
                                Preferred Location
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {LOCATIONS.map(loc => (
                                    <button
                                        key={loc}
                                        onClick={() => setFormData({ ...formData, preferredLocation: loc })}
                                        className={`p-3 rounded-xl border transition-all ${formData.preferredLocation === loc
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white'
                                                : 'bg-slate-900/30 border-slate-600 text-slate-300 hover:border-slate-500'
                                            }`}
                                    >
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={() => step === 3 ? handleSubmit() : setStep(step + 1)}
                            disabled={loading || (step === 1 && !formData.name)}
                            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : step === 3 ? 'Complete Setup' : 'Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

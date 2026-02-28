'use client';

import { useState } from 'react';
import ResumeUploader from './ResumeUploader';
import { useRouter } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProfileForm({ user }: { user: any }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: user.name || '',
        experience: user.experience || 0,
        skills: user.skills?.join(', ') || '',
    });
    const [saving, setSaving] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleResumeData = (data: any) => {
        setFormData(prev => ({
            ...prev,
            skills: data.skills.join(', '),
            experience: data.experience > prev.experience ? data.experience : prev.experience
            // Could also update name if parsed, but name is usually from Auth
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT', // or POST
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    skills: formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
                })
            });

            if (res.ok) {
                router.refresh();
                alert('Profile updated!');
            } else {
                alert('Failed to update profile');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold mb-4 text-slate-800">1. Upload Resume</h2>
                <ResumeUploader onDataExtracted={handleResumeData} />
                <p className="text-sm text-slate-500 mt-2">
                    Upload to autofill Experience and Skills.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-800 pt-4 border-t border-slate-100">2. Review Details</h2>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Experience (Years)</label>
                    <input
                        type="number"
                        value={formData.experience}
                        onChange={e => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        min="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Skills (comma separated)</label>
                    <textarea
                        value={formData.skills}
                        onChange={e => setFormData({ ...formData, skills: e.target.value })}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        rows={4}
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}

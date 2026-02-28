import { dummyJobs } from "@/lib/dummyJobs";
import { dummyPrepData } from "@/lib/dummyPrep";
import { generatePrepContent } from "@/lib/aiPrep";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Code, DollarSign, Users } from "lucide-react";
import { fetchJobs } from "@/lib/jobs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function PrepPage({ params }: { params: { jobId: string } }) {
    const jobId = params.jobId;

    // 1. Try to find in dummyJobs first (historical behavior)
    let job = dummyJobs.find((j) => j.id === jobId);

    // 2. If not found in dummy, we need to fetch it (or pass it via query params in future).
    // For now, if it's not a dummy ID, we assume it's a real ID from JSearch -> fetch details?
    // Actually, JSearch doesn't have a "get job by ID" easy endpoint, we usually pass data.
    // Hack for prototype: If not in dummy, we re-fetch 'Software Engineer Bengaluru' and find it
    // OR just use a generic fallback since we don't have a global state store here.
    if (!job) {
        // Try finding in the last fetched batch? Impossible stateless.
        // Let's create a partial/stub job object if we only have ID but can't fetch easily.
        // Wait, the user clicks from Home which has the data. 
        // Ideally we should pass data via context or re-fetch.
        // Re-fetching 'Software Engineer' to find it is expensive but works for prototype.
        const allJobs = await fetchJobs('Software Engineer Bengaluru');
        job = allJobs.find(j => j.id === jobId);
    }

    if (!job) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Job not found</h1>
                <Link href="/" className="text-blue-600 hover:underline">Go Home</Link>
            </div>
        );
    }

    // 3. Get Prep Data: Check dummy first, else AI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let prep: any = dummyPrepData[jobId];

    if (!prep) {
        // Generate AI prep
        prep = await generatePrepContent(job.company, job.role);
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Jobs
            </Link>

            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden mb-8">
                <div
                    className="h-32 p-6 flex items-end"
                    style={{ background: job.backgroundHint }}
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{job.company} Prep Guide</h1>
                        <p className="text-slate-700 font-medium opacity-90">{job.role}</p>
                    </div>
                </div>

                <div className="p-6">
                    {!prep ? (
                        <div className="text-center py-12 text-slate-500">
                            <p>Prep content coming soon for this role.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* 1. Process */}
                            <section>
                                <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                                    Selection Process
                                </h2>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {prep.selectionProcess.map((step, i) => (
                                        <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-lg relative">
                                            <span className="absolute top-2 right-2 text-6xl text-slate-200 font-bold -z-10 opacity-30">{i + 1}</span>
                                            <p className="font-medium text-slate-700 relative z-10">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* 2. Salary */}
                            <section>
                                <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                    Expected Compensation
                                </h2>
                                <div className="bg-green-50 border border-green-100 p-4 rounded-lg inline-block">
                                    <p className="text-green-800 font-bold text-lg">{prep.salaryRange}</p>
                                </div>
                            </section>

                            {/* 3. Coding Questions */}
                            <section>
                                <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                    <Code className="w-5 h-5 mr-2 text-purple-600" />
                                    Top Coding Questions
                                </h2>
                                <div className="space-y-3">
                                    {prep.codingQuestions.map((q, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 p-4 rounded-lg hover:shadow-sm transition-shadow">
                                            <span className="font-medium text-slate-800 mb-2 sm:mb-0">{q.title}</span>
                                            <div className="flex gap-2">
                                                <a
                                                    href={q.leetcode}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
                                                >
                                                    LeetCode
                                                </a>
                                                <a
                                                    href={q.youtube}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                                                >
                                                    YouTube
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* 4. HR & Exp */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <section>
                                    <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                        <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                                        HR Rounds
                                    </h2>
                                    <ul className="list-disc list-inside space-y-2 text-slate-700 bg-slate-50 p-4 rounded-lg">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {prep.hrQuestions?.map((q: any, i: any) => (
                                            <li key={i}>{q}</li>
                                        ))}
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                        <CheckCircle className="w-5 h-5 mr-2 text-teal-600" />
                                        Experience Questions
                                    </h2>
                                    <div className="bg-teal-50 border border-teal-100 p-4 rounded-lg text-teal-900">
                                        {prep.expQuestions}
                                    </div>
                                </section>
                            </div>

                            {/* 5. Zero to Hero Strategy */}
                            {prep.zeroToHeroStrategy && (
                                <section className="mt-8">
                                    <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                        <Users className="w-5 h-5 mr-2 text-rose-600" />
                                        Zero to Hero Strategy
                                    </h2>
                                    <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {prep.zeroToHeroStrategy.map((step: any, i: number) => (
                                            <div key={i} className="bg-rose-50 border border-rose-100 p-4 rounded-lg">
                                                <h3 className="font-bold text-rose-800 mb-1">{step.split(':')[0]}</h3>
                                                <p className="text-sm text-rose-700">{step.split(':')[1] || step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

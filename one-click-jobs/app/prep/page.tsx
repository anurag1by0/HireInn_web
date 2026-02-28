import { generatePrepContent } from "@/lib/aiPrep";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Code, DollarSign, Users, Rocket, Brain, Target } from "lucide-react";

interface PrepPageProps {
    searchParams: { company?: string; role?: string };
}

export default async function PrepPage({ searchParams }: PrepPageProps) {
    const company = searchParams.company || 'Tech Company';
    const role = searchParams.role || 'Software Engineer';

    // Generate AI prep content
    const prep = await generatePrepContent(company, role);

    const backgroundGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <Link
                    href="/"
                    className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to Jobs
                </Link>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8">
                    {/* Header */}
                    <div
                        className="h-40 p-8 flex items-end relative"
                        style={{ background: backgroundGradient }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm mb-2">
                                <Brain className="w-4 h-4" />
                                AI-Generated Prep Guide
                            </div>
                            <h1 className="text-3xl font-bold text-white">{company}</h1>
                            <p className="text-white/90 font-medium">{role}</p>
                        </div>
                    </div>

                    <div className="p-8">
                        {!prep ? (
                            <div className="text-center py-12">
                                <Rocket className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                <h2 className="text-xl font-semibold text-slate-600 mb-2">
                                    Generating your prep guide...
                                </h2>
                                <p className="text-slate-400">
                                    Our AI is creating personalized content. Refresh in a moment.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {/* Selection Process */}
                                {prep.selectionProcess && (
                                    <section>
                                        <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                            <Target className="w-5 h-5 mr-2 text-blue-600" />
                                            Selection Process
                                        </h2>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            {prep.selectionProcess.map((step: string, i: number) => (
                                                <div key={i} className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4 rounded-xl relative group hover:shadow-md transition-shadow">
                                                    <span className="absolute top-2 right-3 text-5xl text-slate-200 font-bold">{i + 1}</span>
                                                    <p className="font-medium text-slate-700 relative z-10 text-sm">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Salary */}
                                {prep.salaryRange && (
                                    <section>
                                        <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                            Expected Compensation
                                        </h2>
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-5 rounded-xl inline-block">
                                            <p className="text-green-800 font-bold text-xl">{prep.salaryRange}</p>
                                        </div>
                                    </section>
                                )}

                                {/* Coding Questions */}
                                {prep.codingQuestions && prep.codingQuestions.length > 0 && (
                                    <section>
                                        <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                            <Code className="w-5 h-5 mr-2 text-purple-600" />
                                            Top Coding Questions
                                        </h2>
                                        <div className="space-y-3">
                                            {prep.codingQuestions.map((q: { title: string; leetcode?: string; youtube?: string }, i: number) => (
                                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 p-4 rounded-xl hover:shadow-md transition-shadow">
                                                    <span className="font-medium text-slate-800 mb-2 sm:mb-0">{q.title}</span>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {q.leetcode && (
                                                            <a
                                                                href={q.leetcode}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                                                            >
                                                                LeetCode
                                                            </a>
                                                        )}
                                                        {q.youtube && (
                                                            <a
                                                                href={q.youtube}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                                            >
                                                                YouTube
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* HR & Experience */}
                                <div className="grid md:grid-cols-2 gap-8">
                                    {prep.hrQuestions && (
                                        <section>
                                            <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                                <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                                                HR Round Questions
                                            </h2>
                                            <ul className="space-y-2 text-slate-700 bg-indigo-50 p-5 rounded-xl">
                                                {prep.hrQuestions.map((q: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-indigo-500 mt-1">•</span>
                                                        <span>{q}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {prep.expQuestions && (
                                        <section>
                                            <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                                <Users className="w-5 h-5 mr-2 text-teal-600" />
                                                Experience Questions
                                            </h2>
                                            <div className="bg-teal-50 border border-teal-100 p-5 rounded-xl text-teal-900">
                                                {prep.expQuestions}
                                            </div>
                                        </section>
                                    )}
                                </div>

                                {/* Zero to Hero */}
                                {prep.zeroToHeroStrategy && (
                                    <section>
                                        <h2 className="flex items-center text-xl font-bold text-slate-800 mb-4">
                                            <Rocket className="w-5 h-5 mr-2 text-rose-600" />
                                            Zero to Hero Strategy
                                        </h2>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {prep.zeroToHeroStrategy.map((step: string, i: number) => {
                                                const [phase, ...rest] = step.split(':');
                                                return (
                                                    <div key={i} className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 p-5 rounded-xl">
                                                        <h3 className="font-bold text-rose-800 mb-2">{phase}</h3>
                                                        <p className="text-sm text-rose-700">{rest.join(':').trim() || step}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

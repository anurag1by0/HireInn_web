'use client';

import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface ResumeData {
    text: string;
    skills: string[];
    experience: number;
}

interface ResumeUploaderProps {
    onDataExtracted: (data: ResumeData) => void;
}

export default function ResumeUploader({ onDataExtracted }: ResumeUploaderProps) {
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const extractText = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + ' ';
        }
        return fullText;
    };

    const parseResume = (text: string): ResumeData => {
        // Simple dummy regex logic
        const skillsKeywords = [
            'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'AWS', 'Docker',
            'MongoDB', 'SQL', 'HTML', 'CSS', 'Tailwind', 'Next.js'
        ];

        const foundSkills = skillsKeywords.filter(skill =>
            new RegExp(`\\b${skill}\\b`, 'i').test(text)
        );

        // Try to find experience years like "5 years", "5+ years", "2018 - 2023"
        // Very basic heuristic: look for numbers near "experience" or just grab first likely number
        let experience = 0;
        const expMatch = text.match(/(\d+)\+?\s*years?/i);
        if (expMatch) {
            experience = parseInt(expMatch[1], 10);
        } else {
            // Look for date ranges? Too complex for prototype regex.
            // Default to a random realistic number if text length suggests seniority?
            // No, keep it 0 if not found so user fills it.
        }

        return {
            text,
            skills: [...new Set(foundSkills)], // unique
            experience
        };
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }

        setLoading(true);
        setError(null);
        setFileName(file.name);

        try {
            const text = await extractText(file);
            const data = parseResume(text);
            onDataExtracted(data);
        } catch (err) {
            console.error(err);
            setError('Failed to parse PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                    {loading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    ) : fileName ? (
                        <>
                            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                            <p className="text-sm font-medium">{fileName}</p>
                            <p className="text-xs text-slate-400">Click to replace</p>
                        </>
                    ) : (
                        <>
                            <Upload className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium">Upload Resume (PDF)</p>
                            <p className="text-xs text-slate-400">We'll autofill your details</p>
                        </>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={loading}
                />
            </label>
            {error && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
}

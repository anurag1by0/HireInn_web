import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import JobCard from './JobCard';
import { Job } from '@/lib/dummyJobs'; // Ensure this matches user's types

interface JobRowProps {
    title: string;
    jobs: Job[];
    onSelect: (job: Job) => void;
}

export default function JobRow({ title, jobs, onSelect }: JobRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="mb-8 group/row">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 px-4 md:px-8 flex items-center gap-2">
                {title}
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover/row:text-white transition-colors cursor-pointer" />
            </h2>

            <div className="relative group">
                <ChevronLeft
                    className="absolute left-0 top-0 bottom-0 z-40 m-auto w-12 h-12 text-white cursor-pointer bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125 p-2"
                    onClick={() => scroll('left')}
                />

                <div
                    ref={rowRef}
                    className="flex gap-4 overflow-x-scroll scrollbar-hide px-4 md:px-8 pb-8 pt-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {jobs.map((job, idx) => (
                        <JobCard key={job.id || idx} job={job} onSelect={onSelect} />
                    ))}
                </div>

                <ChevronRight
                    className="absolute right-0 top-0 bottom-0 z-40 m-auto w-12 h-12 text-white cursor-pointer bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125 p-2"
                    onClick={() => scroll('right')}
                />
            </div>
        </div>
    );
}

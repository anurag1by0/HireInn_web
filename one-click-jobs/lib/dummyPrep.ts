export interface PrepData {
    company: string;
    selectionProcess: string[];
    salaryRange: string;
    codingQuestions: { title: string; leetcode: string; youtube: string }[];
    hrQuestions: string[];
    expQuestions: string;
}

export const dummyPrepData: Record<string, PrepData> = {
    '1': {
        company: 'Google',
        selectionProcess: [
            'Online Assessment (90 mins, 2 Hard problems)',
            'Phone Screen (45 mins, 1 Medium-Hard)',
            '3 Onsite Coding Rounds (DSA focus)',
            'Googliness & Leadership Principles'
        ],
        salaryRange: '₹25L - ₹60L + Stocks',
        codingQuestions: [
            {
                title: 'Trapping Rain Water',
                leetcode: 'https://leetcode.com/problems/trapping-rain-water/',
                youtube: 'https://www.youtube.com/results?search_query=trapping+rain+water+problem'
            },
            {
                title: 'Median of Two Sorted Arrays',
                leetcode: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
                youtube: 'https://www.youtube.com/results?search_query=median+of+two+sorted+arrays'
            }
        ],
        hrQuestions: [
            'Tell me about a time you failed.',
            'How do you handle conflict in a team?'
        ],
        expQuestions: 'Design a scalable URL shortener like bit.ly. Focus on database schema and caching strategies.'
    },
    '2': {
        company: 'Amazon',
        selectionProcess: [
            'Online Assessment (Debugging + Coding)',
            'Technical Phone Screen',
            'Bar Raiser Round (Leadership Principles)',
            'System Design Round'
        ],
        salaryRange: '₹30L - ₹55L + Sign-on Bonus',
        codingQuestions: [
            {
                title: 'LRU Cache',
                leetcode: 'https://leetcode.com/problems/lru-cache/',
                youtube: 'https://www.youtube.com/results?search_query=lru+cache+problem'
            },
            {
                title: 'Number of Islands',
                leetcode: 'https://leetcode.com/problems/number-of-islands/',
                youtube: 'https://www.youtube.com/results?search_query=number+of+islands'
            }
        ],
        hrQuestions: [
            'Tell me about a time you showed customer obsession.',
            'Describe a situation where you had to make a decision with limited data.'
        ],
        expQuestions: 'Design a parking lot system. Focus on object-oriented design and extensibility.'
    }
};

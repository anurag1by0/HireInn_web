export interface Job {
    id: string;
    company: string;
    role: string;
    experience: string;
    location: string;
    description: string; // Renamed/Mapped from details
    qualification?: string;
    isRemote?: boolean;
    type?: string;
    // Legacy/UI fields
    backgroundHint?: string;
    salary?: string;
    details?: string; // keeping for backward compatibility if needed, or mapping to description
    applyLink?: string;
}

export const dummyJobs: Job[] = [
    {
        id: '1',
        company: 'Google India',
        role: 'Software Engineer II',
        experience: '2-6 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        salary: '₹25L - ₹45L',
        details: 'Full stack development role in the Google Cloud team, focusing on scalable infrastructure.',
        description: 'Full stack development role in the Google Cloud team, focusing on scalable infrastructure.',
        type: 'Full-time'
    },
    {
        id: '2',
        company: 'Amazon',
        role: 'SDE II',
        experience: '3-8 yrs',
        location: 'Bengaluru (Hybrid)',
        backgroundHint: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
        salary: '₹30L - ₹55L',
        details: 'Join the Amazon Pay team to build next-gen payment solutions for millions of users.',
        description: 'Join the Amazon Pay team to build next-gen payment solutions for millions of users.',
        type: 'Full-time',
        isRemote: false
    },
    {
        id: '3',
        company: 'Microsoft',
        role: 'Senior Software Engineer',
        experience: '5+ yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        salary: '₹40L - ₹70L',
        details: 'Work on Azure AI services and help enterprise customers modernize their stack.',
        description: 'Work on Azure AI services and help enterprise customers modernize their stack.',
        type: 'Full-time',
    },
    {
        id: '4',
        company: 'Swiggy',
        role: 'Backend Engineer',
        experience: '1-4 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #fff1f2 0%, #enc3c8 100%)', // Orange/Pinkish
        salary: '₹18L - ₹30L',
        details: 'High scale backend systems for quick commerce delivery.',
        description: 'High scale backend systems for quick commerce delivery.',
        type: 'Full-time'
    },
    {
        id: '5',
        company: 'Flipkart',
        role: 'UI Engineer',
        experience: '2-5 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)',
        salary: '₹20L - ₹35L',
        details: 'Crafting the shopping experience for the next billion users.',
        description: 'Crafting the shopping experience for the next billion users.',
        type: 'Full-time'
    },
    {
        id: '6',
        company: 'Atlassian',
        role: 'Full Stack Engineer',
        experience: '3-7 yrs',
        location: 'Remote / Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)',
        salary: '₹28L - ₹50L',
        details: 'Building collaboration tools used by teams worldwide.',
        description: 'Building collaboration tools used by teams worldwide.',
        type: 'Full-time',
        isRemote: true
    },
    {
        id: '7',
        company: 'Razorpay',
        role: 'Product Engineer',
        experience: '1-3 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #eef2ff 0%, #c7d2fe 100%)',
        salary: '₹20L - ₹35L',
        details: 'Powering financial ecosystem for Indian businesses.',
        description: 'Powering financial ecosystem for Indian businesses.',
        type: 'Full-time'
    },
    {
        id: '8',
        company: 'Zerodha',
        role: 'Go Developer',
        experience: '2-5 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #f0fdfa 0%, #99f6e4 100%)',
        salary: '₹25L - ₹45L',
        details: 'Building low latency trading systems with Go.',
        description: 'Building low latency trading systems with Go.',
        type: 'Full-time'
    },
    {
        id: '9',
        company: 'PhonePe',
        role: 'Android Engineer',
        experience: '2-4 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #fae8ff 0%, #e879f9 100%)',
        salary: '₹22L - ₹40L',
        details: 'Build the most loved payments app in India.',
        description: 'Build the most loved payments app in India.',
        type: 'Full-time'
    },
    {
        id: '10',
        company: 'Meesho',
        role: 'Data Engineer',
        experience: '3-6 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
        salary: '₹28L - ₹48L',
        details: 'Process billions of events daily for social commerce.',
        description: 'Process billions of events daily for social commerce.',
        type: 'Full-time'
    },
    {
        id: '11',
        company: 'Ola',
        role: 'Platform Engineer',
        experience: '4-7 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)',
        salary: '₹30L - ₹55L',
        details: 'Build ride-hailing infrastructure at massive scale.',
        description: 'Build ride-hailing infrastructure at massive scale.',
        type: 'Full-time'
    },
    {
        id: '12',
        company: 'Cred',
        role: 'iOS Engineer',
        experience: '2-5 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #f5f5f4 0%, #a8a29e 100%)',
        salary: '₹25L - ₹50L',
        details: 'Craft premium mobile experiences for creditworthy India.',
        description: 'Craft premium mobile experiences for creditworthy India.',
        type: 'Full-time'
    },
    {
        id: '13',
        company: 'Groww',
        role: 'Backend Engineer',
        experience: '1-3 yrs',
        location: 'Bengaluru',
        backgroundHint: 'linear-gradient(135deg, #dbeafe 0%, #60a5fa 100%)',
        salary: '₹18L - ₹32L',
        details: 'Democratize investing for millions of Indians.',
        description: 'Democratize investing for millions of Indians.',
        type: 'Full-time'
    },
    {
        id: '14',
        company: 'Zomato',
        role: 'ML Engineer',
        experience: '3-6 yrs',
        location: 'Gurugram',
        backgroundHint: 'linear-gradient(135deg, #fee2e2 0%, #f87171 100%)',
        salary: '₹32L - ₹60L',
        details: 'Build recommendation systems for food delivery.',
        description: 'Build recommendation systems for food delivery.',
        type: 'Full-time'
    },
    {
        id: '15',
        company: 'Paytm',
        role: 'DevOps Engineer',
        experience: '2-5 yrs',
        location: 'Noida',
        backgroundHint: 'linear-gradient(135deg, #e0f2fe 0%, #38bdf8 100%)',
        salary: '₹20L - ₹38L',
        details: 'Manage infrastructure for India\'s digital payments.',
        description: 'Manage infrastructure for India\'s digital payments.',
        type: 'Full-time'
    },
    {
        id: '16',
        company: 'Directi',
        role: 'Security Engineer',
        experience: '4-8 yrs',
        location: 'Mumbai',
        backgroundHint: 'linear-gradient(135deg, #fef9c3 0%, #facc15 100%)',
        salary: '₹35L - ₹65L',
        details: 'Protect critical internet infrastructure globally.',
        description: 'Protect critical internet infrastructure globally.',
        type: 'Full-time'
    }
];



import Groq from "groq-sdk";
import OpenAI from "openai";

const getGroq = () => {
    if (!process.env.GROQ_API_KEY) return null;
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const getOpenAI = () => {
    if (!process.env.OPENAI_API_KEY) return null;
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const ENHANCED_PROMPT = `You are a senior tech recruiter with access to GeeksforGeeks, Glassdoor, and LeetCode interview data.

Create a REALISTIC interview prep guide for {role} at {company} based on ACTUAL interview experiences.

Research these sources mentally:
- GeeksforGeeks company interview experiences
- Glassdoor interview reviews
- LeetCode discuss forums
- Blind app company reviews

Return ONLY valid JSON:
{
  "selectionProcess": ["Actual round names from {company}"],
  "salaryRange": "Current market rate in India for {role} at {company}",
  "codingQuestions": [
      { 
        "title": "Actual problem asked at {company}", 
        "leetcode": "https://leetcode.com/problems/exact-problem/",
        "youtube": "https://youtube.com/results?search_query=problem+name+solution"
      }
  ],
  "hrQuestions": ["Company-specific HR questions based on {company} culture"],
  "expQuestions": "Real system design question asked at {company}",
  "zeroToHeroStrategy": [
    "Day 1-2: Focus areas specific to {company} interview pattern",
    "Day 3-5: Practice {company}'s most asked problem types",
    "Day 6-7: Mock interviews + {company} culture research"
  ]
}

Be SPECIFIC to {company}. For example:
- Google: Focus on graphs, trees, system design
- Amazon: Leadership principles, OOP design
- Microsoft: Azure knowledge, behavioral STAR method
- Startups: Product thinking, full-stack breadth`;

const prepCache = new Map<string, object>();

export async function generatePrepContent(company: string, role: string) {
    const cacheKey = `${company}-${role}`;

    if (prepCache.has(cacheKey)) {
        return prepCache.get(cacheKey);
    }

    const enhancedPrompt = ENHANCED_PROMPT
        .replace(/{role}/g, role)
        .replace(/{company}/g, company);

    const userPrompt = `Generate interview prep for ${role} at ${company}. Include REAL questions asked at this company.`;

    // Try Groq first
    const groq = getGroq();
    if (groq) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: enhancedPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.4,
                max_tokens: 1500
            });

            const content = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
            prepCache.set(cacheKey, parsed);
            return parsed;
        } catch (e) {
            console.error("Groq failed:", e);
        }
    }

    // Fallback to OpenAI
    const openai = getOpenAI();
    if (openai) {
        try {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: enhancedPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: "gpt-3.5-turbo",
                max_tokens: 1500
            });

            const content = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
            prepCache.set(cacheKey, parsed);
            return parsed;
        } catch (e) {
            console.error("OpenAI failed:", e);
        }
    }

    return getCompanySpecificFallback(company, role);
}

function getCompanySpecificFallback(company: string, role: string) {
    const companyLower = company.toLowerCase();

    // Company-specific data based on common patterns
    const companyData: Record<string, any> = {
        'google': {
            selectionProcess: ["Phone Screen", "Technical Round 1 (Graphs/Trees)", "Technical Round 2 (System Design)", "Googleyness & Leadership", "Team Matching"],
            codingQuestions: [
                { title: "LRU Cache", leetcode: "https://leetcode.com/problems/lru-cache/", youtube: "https://youtube.com/results?search_query=lru+cache+leetcode" },
                { title: "Word Ladder", leetcode: "https://leetcode.com/problems/word-ladder/", youtube: "https://youtube.com/results?search_query=word+ladder+leetcode" },
                { title: "Serialize and Deserialize Binary Tree", leetcode: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", youtube: "https://youtube.com/results?search_query=serialize+deserialize+tree" }
            ],
            hrQuestions: [
                "Why Google?",
                "Tell me about a time you disagreed with your manager",
                "How do you handle ambiguity?",
                "Describe a project you're most proud of"
            ],
            salaryRange: "₹35L - ₹60L (L3-L4)"
        },
        'amazon': {
            selectionProcess: ["Online Assessment", "Technical Round 1", "Technical Round 2", "Bar Raiser Round", "Hiring Manager Round"],
            codingQuestions: [
                { title: "Two Sum", leetcode: "https://leetcode.com/problems/two-sum/", youtube: "https://youtube.com/results?search_query=two+sum" },
                { title: "Merge K Sorted Lists", leetcode: "https://leetcode.com/problems/merge-k-sorted-lists/", youtube: "https://youtube.com/results?search_query=merge+k+sorted+lists" },
                { title: "LRU Cache", leetcode: "https://leetcode.com/problems/lru-cache/", youtube: "https://youtube.com/results?search_query=lru+cache" }
            ],
            hrQuestions: [
                "Tell me about a time you failed (Ownership)",
                "Describe a time you had to make a decision with incomplete information (Bias for Action)",
                "How do you handle customer complaints? (Customer Obsession)",
                "Tell me about a time you simplified a process (Invent and Simplify)"
            ],
            salaryRange: "₹30L - ₹55L (SDE2)"
        },
        'microsoft': {
            selectionProcess: ["Online Assessment", "Technical Round 1", "Technical Round 2", "Hiring Manager Round", "AA/AS Round"],
            codingQuestions: [
                { title: "Reverse Linked List", leetcode: "https://leetcode.com/problems/reverse-linked-list/", youtube: "https://youtube.com/results?search_query=reverse+linked+list" },
                { title: "Binary Tree Level Order Traversal", leetcode: "https://leetcode.com/problems/binary-tree-level-order-traversal/", youtube: "https://youtube.com/results?search_query=level+order+traversal" },
                { title: "Design Tic-Tac-Toe", leetcode: "https://leetcode.com/problems/design-tic-tac-toe/", youtube: "https://youtube.com/results?search_query=design+tic+tac+toe" }
            ],
            hrQuestions: [
                "Why Microsoft?",
                "How do you stay updated with technology?",
                "Describe a time you worked in a team",
                "What's your experience with Azure/Cloud?"
            ],
            salaryRange: "₹40L - ₹70L (L61-L62)"
        }
    };

    // Check if we have specific data for this company
    for (const [key, data] of Object.entries(companyData)) {
        if (companyLower.includes(key)) {
            return {
                ...data,
                expQuestions: `Design a scalable system similar to ${company}'s core product. Consider load balancing, caching, and database sharding.`,
                zeroToHeroStrategy: [
                    `Day 1-2: Master ${company}'s most asked data structures (Arrays, Trees, Graphs)`,
                    `Day 3-4: Practice ${company}-specific problem patterns`,
                    `Day 5-6: System design + ${company} culture research`,
                    "Day 7: Mock interviews with STAR method for behavioral"
                ]
            };
        }
    }

    // Generic fallback
    return {
        selectionProcess: ["Online Assessment", "Technical Round 1", "Technical Round 2", "HR Round"],
        salaryRange: "₹15L - ₹35L (varies by experience)",
        codingQuestions: [
            { title: "Two Sum", leetcode: "https://leetcode.com/problems/two-sum/", youtube: "https://youtube.com/results?search_query=two+sum" },
            { title: "Valid Parentheses", leetcode: "https://leetcode.com/problems/valid-parentheses/", youtube: "https://youtube.com/results?search_query=valid+parentheses" },
            { title: "Merge Intervals", leetcode: "https://leetcode.com/problems/merge-intervals/", youtube: "https://youtube.com/results?search_query=merge+intervals" }
        ],
        hrQuestions: [
            "Tell me about yourself",
            `Why ${company}?`,
            "Where do you see yourself in 5 years?",
            "Describe a challenging project"
        ],
        expQuestions: `Design a system for ${company}'s core product. Focus on scalability and reliability.`,
        zeroToHeroStrategy: [
            "Day 1-2: Arrays, Strings, HashMaps",
            "Day 3-4: Trees, Graphs, DP",
            `Day 5-6: ${company} research + system design`,
            "Day 7: Mock interviews"
        ]
    };
}

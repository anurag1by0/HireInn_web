"""
Constants for dropdown options and predefined values
"""

# Experience levels with hierarchy
EXPERIENCE_LEVELS = [
    {"value": "0-1", "label": "0-1 years (Fresher)", "level": 0},
    {"value": "1-3", "label": "1-3 years (Junior)", "level": 1},
    {"value": "3-5", "label": "3-5 years (Mid-level)", "level": 2},
    {"value": "5-8", "label": "5-8 years (Senior)", "level": 3},
    {"value": "8-12", "label": "8-12 years (Lead)", "level": 4},
    {"value": "12+", "label": "12+ years (Principal/Architect)", "level": 5}
]

# Comprehensive list of engineering roles
ENGINEERING_ROLES = [
    # Backend
    "Backend Engineer",
    "Backend Developer",
    "API Developer",
    "Microservices Engineer",
    "Node.js Developer",
    "Python Developer",
    "Java Developer",
    "Go Developer",
    ".NET Developer",
    
    # Frontend
    "Frontend Engineer",
    "Frontend Developer",
    "React Developer",
    "Angular Developer",
    "Vue.js Developer",
    "UI Developer",
    "JavaScript Developer",
    "TypeScript Developer",
    
    # Full Stack
    "Full Stack Engineer",
    "Full Stack Developer",
    "MERN Stack Developer",
    "MEAN Stack Developer",
    "Full Stack JavaScript Developer",
    
    # Mobile
    "Android Developer",
    "iOS Developer",
    "React Native Developer",
    "Flutter Developer",
    "Mobile App Developer",
    "Kotlin Developer",
    "Swift Developer",
    
    # DevOps & Infrastructure
    "DevOps Engineer",
    "Site Reliability Engineer (SRE)",
    "Cloud Engineer",
    "Infrastructure Engineer",
    "Platform Engineer",
    "AWS Engineer",
    "Azure Engineer",
    "GCP Engineer",
    "Kubernetes Engineer",
    "Docker Engineer",
    
    # Data & ML
    "Data Engineer",
    "Data Scientist",
    "Machine Learning Engineer",
    "AI Engineer",
    "MLOps Engineer",
    "Big Data Engineer",
    "Data Analyst",
    "Business Intelligence Engineer",
    
    # QA & Testing
    "QA Engineer",
    "Test Automation Engineer",
    "SDET (Software Development Engineer in Test)",
    "Quality Analyst",
    "Performance Test Engineer",
    "Manual Tester",
    
    # Security
    "Security Engineer",
    "Application Security Engineer",
    "DevSecOps Engineer",
    "Cybersecurity Engineer",
    "Penetration Tester",
    
    # Database
    "Database Administrator (DBA)",
    "Database Engineer",
    "SQL Developer",
    "NoSQL Developer",
    
    # Specialized
    "Blockchain Developer",
    "Game Developer",
    "Embedded Systems Engineer",
    "IoT Engineer",
    "AR/VR Developer",
    "Graphics Engineer",
    "Systems Engineer",
    "Network Engineer",
    
    # Leadership & Architecture
    "Engineering Manager",
    "Technical Lead",
    "Team Lead",
    "Staff Engineer",
    "Principal Engineer",
    "Solutions Architect",
    "Software Architect",
    "Cloud Architect",
    "Data Architect",
    
    # Other
    "Software Engineer",
    "Software Developer",
    "Computer Programmer",
    "Application Developer",
    "Web Developer"
]

# Major cities and locations in India
LOCATIONS = [
    "Remote",
    "Anywhere in India",
    
    # Tier 1 Cities
    "Bangalore",
    "Mumbai",
    "Delhi NCR",
    "Hyderabad",
    "Pune",
    "Chennai",
    "Kolkata",
    
    # Tier 2 Cities
    "Ahmedabad",
    "Gurgaon",
    "Noida",
    "Kochi",
    "Chandigarh",
    "Jaipur",
    "Indore",
    "Coimbatore",
    "Vadodara",
    "Nagpur",
    "Visakhapatnam",
    "Lucknow",
    "Bhubaneswar",
    "Thiruvananthapuram",
    "Mysore",
    
    # International (if applicable)
    "International - USA",
    "International - UK",
    "International - Europe",
    "International - Singapore",
    "International - Dubai",
    "International - Canada",
    "International - Australia"
]

# Job types
JOB_TYPES = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship",
    "Temporary"
]

# Work modes
WORK_MODES = [
    "Remote",
    "Hybrid",
    "On-site"
]

# Salary ranges (in LPA - Lakhs Per Annum)
SALARY_RANGES = [
    "0-3 LPA",
    "3-6 LPA",
    "6-10 LPA",
    "10-15 LPA",
    "15-20 LPA",
    "20-30 LPA",
    "30-50 LPA",
    "50+ LPA"
]

# Notice periods
NOTICE_PERIODS = [
    "Immediate",
    "15 days",
    "1 month",
    "2 months",
    "3 months",
    "Serving notice period"
]

# Education levels
EDUCATION_LEVELS = [
    "High School",
    "Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD",
    "Other"
]

# Common technical skills (for autocomplete)
COMMON_SKILLS = [
    # Programming Languages
    "Python", "JavaScript", "Java", "C++", "C#", "Go", "Rust", "TypeScript",
    "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB",
    
    # Frontend
    "React", "Angular", "Vue.js", "HTML", "CSS", "SASS", "Bootstrap",
    "Tailwind CSS", "jQuery", "Next.js", "Nuxt.js", "Svelte",
    
    # Backend
    "Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot",
    "ASP.NET", "Ruby on Rails", "Laravel", "NestJS",
    
    # Databases
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Cassandra", "DynamoDB",
    "Oracle", "SQL Server", "SQLite", "Elasticsearch",
    
    # Cloud & DevOps
    "AWS", "Azure", "Google Cloud (GCP)", "Docker", "Kubernetes",
    "Jenkins", "GitLab CI/CD", "GitHub Actions", "Terraform", "Ansible",
    
    # Mobile
    "React Native", "Flutter", "Android SDK", "iOS SDK", "Xamarin",
    
    # Data & ML
    "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy",
    "Apache Spark", "Hadoop", "Kafka", "Airflow",
    
    # Tools
    "Git", "Jira", "Postman", "VS Code", "IntelliJ IDEA",
    "Figma", "Adobe XD", "Slack"
]


def get_experience_level_number(experience_str):
    """Convert experience string to numeric level"""
    for exp in EXPERIENCE_LEVELS:
        if exp["value"] == experience_str:
            return exp["level"]
    return 0


def is_valid_experience(experience_str):
    """Check if experience string is valid"""
    return any(exp["value"] == experience_str for exp in EXPERIENCE_LEVELS)


def is_valid_role(role_str):
    """Check if role is in predefined list"""
    return role_str in ENGINEERING_ROLES


def is_valid_location(location_str):
    """Check if location is in predefined list"""
    return location_str in LOCATIONS

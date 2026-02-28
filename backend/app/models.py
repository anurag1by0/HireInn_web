"""
Pydantic models for User, Profile, Job, and Authentication
"""
from pydantic.v1 import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


# ============= Authentication Models =============

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


# ============= User Models =============

class UserInDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True
    resume_file_path: Optional[str] = None
    resume_parsed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime
    profile_status: str  # "pending", "parsing", "complete", "failed"


# ============= Profile Models =============

class PersonalInfo(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class Skills(BaseModel):
    technical: List[str] = []
    soft: List[str] = []
    programming_languages: List[str] = []
    tools_frameworks: List[str] = []
    all_skills_normalized: List[str] = []


class WorkExperience(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    responsibilities: List[str] = []
    achievements: List[str] = []
    technologies: List[str] = []


class Education(BaseModel):
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    institution: Optional[str] = None
    location: Optional[str] = None
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None


class Certification(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    date: Optional[str] = None
    credential_id: Optional[str] = None


class Project(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = []
    url: Optional[str] = None


class UserProfile(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    
    # Personal Info
    personal_info: PersonalInfo = PersonalInfo()
    
    # Professional Summary
    summary: Optional[str] = None
    
    # Skills
    skills: Skills = Skills()
    
    # Work Experience
    work_experience: List[WorkExperience] = []
    
    # Education
    education: List[Education] = []
    
    # Certifications
    certifications: List[Certification] = []
    
    # Projects
    projects: List[Project] = []
    
    # Calculated Fields
    total_years_experience: float = 0.0
    experience_level: str = "entry"  # entry, mid, senior, lead
    
    # Metadata
    profile_completeness: int = 0  # 0-100
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    parsing_status: str = "pending"  # pending, success, partial, failed
    parsing_errors: List[str] = []
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ProfileResponse(BaseModel):
    user_id: str
    personal_info: PersonalInfo
    summary: Optional[str]
    skills: Skills
    work_experience: List[WorkExperience]
    education: List[Education]
    certifications: List[Certification]
    projects: List[Project]
    total_years_experience: float
    experience_level: str
    profile_completeness: int


# ============= Job Models =============

class Job(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    job_id: str
    company: str
    role: str
    location: str
    is_remote: bool = False
    type: str = "Full-time"
    
    # For matching
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    experience_level: Optional[str] = None
    min_years_experience: Optional[int] = None
    max_years_experience: Optional[int] = None
    
    description: str
    salary: Optional[str] = None
    posted_at: datetime = Field(default_factory=datetime.utcnow)
    expire_at: Optional[datetime] = None
    url: str
    source: str = "scraper"
    is_verified: bool = False
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class JobRecommendation(BaseModel):
    job: dict
    match_score: float
    match_percentage: str
    matching_skills: List[str]
    missing_skills: List[str]


class SavedJob(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    job_id: PyObjectId
    saved_at: datetime = Field(default_factory=datetime.utcnow)
    match_score: Optional[float] = None
    notes: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ============= Analytics Models =============

class UserStats(BaseModel):
    total_jobs_available: int
    recommended_jobs: int
    saved_jobs: int
    profile_completeness: int
    top_matching_skills: List[str]
    skill_coverage_percentage: float

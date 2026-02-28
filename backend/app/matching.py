"""
Job matching algorithm with intelligent scoring
"""
import logging
from typing import List, Dict, Tuple
from app.models import UserProfile, Job, JobRecommendation
from datetime import datetime

logger = logging.getLogger(__name__)

# Experience level hierarchy
EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"]


class JobMatcher:
    """Intelligent job matching service"""
    
    def calculate_match_score(self, user_profile: UserProfile, job: Job) -> float:
        """
        Calculate match score between user profile and job
        
        Args:
            user_profile: User's profile with skills and experience
            job: Job posting with requirements
            
        Returns:
            Match score (0-100)
        """
        score = 0.0
        
        # Get user skills (normalized)
        user_skills = set(user_profile.skills.all_skills_normalized)
        
        # 1. Required Skills Match (50 points)
        required_skills = set(skill.lower().strip() for skill in job.required_skills if skill)
        
        if required_skills:
            required_matches = user_skills & required_skills
            required_match_ratio = len(required_matches) / len(required_skills)
            score += required_match_ratio * 50
        else:
            # If no required skills specified, give partial credit
            score += 25
        
        # 2. Preferred Skills Match (20 points)
        preferred_skills = set(skill.lower().strip() for skill in job.preferred_skills if skill)
        
        if preferred_skills:
            preferred_matches = user_skills & preferred_skills
            preferred_match_ratio = len(preferred_matches) / len(preferred_skills)
            score += preferred_match_ratio * 20
        
        # 3. Experience Level Match (20 points)
        if job.experience_level:
            user_level = user_profile.experience_level
            job_level = job.experience_level.lower()
            
            if user_level == job_level:
                score += 20
            elif self._are_adjacent_levels(user_level, job_level):
                score += 10  # Adjacent level (e.g., mid applying for senior)
            elif self._is_overqualified(user_level, job_level):
                score += 5  # Overqualified but might still be interested
        
        # 4. Years of Experience Match (10 points)
        if job.min_years_experience is not None or job.max_years_experience is not None:
            user_years = user_profile.total_years_experience
            
            min_years = job.min_years_experience or 0
            max_years = job.max_years_experience or 100
            
            if min_years <= user_years <= max_years:
                score += 10  # Perfect fit
            elif user_years >= min_years:
                # Overqualified but within reason
                if user_years - max_years <= 3:
                    score += 5
            elif user_years < min_years:
                # Underqualified - reduce score
                gap = min_years - user_years
                if gap <= 1:
                    score += 3  # Close enough
        
        return min(round(score, 2), 100.0)
    
    def get_matching_skills(self, user_profile: UserProfile, job: Job) -> Tuple[List[str], List[str]]:
        """
        Get matching and missing skills
        
        Returns:
            Tuple of (matching_skills, missing_skills)
        """
        user_skills = set(user_profile.skills.all_skills_normalized)
        required_skills = set(skill.lower().strip() for skill in job.required_skills if skill)
        
        matching = list(user_skills & required_skills)
        missing = list(required_skills - user_skills)
        
        return matching, missing
    
    def create_recommendation(self, user_profile: UserProfile, job: Job) -> JobRecommendation:
        """
        Create a job recommendation with match analysis
        
        Args:
            user_profile: User's profile
            job: Job posting
            
        Returns:
            JobRecommendation object
        """
        score = self.calculate_match_score(user_profile, job)
        matching_skills, missing_skills = self.get_matching_skills(user_profile, job)
        
        # Convert job to dict for response
        job_dict = {
            "id": str(job.id) if job.id else None,
            "job_id": job.job_id,
            "company": job.company,
            "role": job.role,
            "location": job.location,
            "is_remote": job.is_remote,
            "type": job.type,
            "salary": job.salary,
            "description": job.description,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills,
            "experience_level": job.experience_level,
            "url": job.url,
            "posted_at": job.posted_at.isoformat() if job.posted_at else None
        }
        
        return JobRecommendation(
            job=job_dict,
            match_score=score,
            match_percentage=f"{int(score)}%",
            matching_skills=matching_skills,
            missing_skills=missing_skills
        )
    
    def _are_adjacent_levels(self, level1: str, level2: str) -> bool:
        """Check if two experience levels are adjacent"""
        try:
            idx1 = EXPERIENCE_LEVELS.index(level1)
            idx2 = EXPERIENCE_LEVELS.index(level2)
            return abs(idx1 - idx2) == 1
        except ValueError:
            return False
    
    def _is_overqualified(self, user_level: str, job_level: str) -> bool:
        """Check if user is overqualified for the job"""
        try:
            user_idx = EXPERIENCE_LEVELS.index(user_level)
            job_idx = EXPERIENCE_LEVELS.index(job_level)
            return user_idx > job_idx
        except ValueError:
            return False
    
    def get_adjacent_levels(self, level: str) -> List[str]:
        """Get current level and adjacent levels for filtering"""
        try:
            idx = EXPERIENCE_LEVELS.index(level)
            levels = [level]
            
            # Add previous level
            if idx > 0:
                levels.append(EXPERIENCE_LEVELS[idx - 1])
            
            # Add next level
            if idx < len(EXPERIENCE_LEVELS) - 1:
                levels.append(EXPERIENCE_LEVELS[idx + 1])
            
            return levels
            
        except ValueError:
            return [level]


# Global instance
job_matcher = JobMatcher()

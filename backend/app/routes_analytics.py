"""
Analytics and statistics API endpoints
"""
import logging
from fastapi import APIRouter, Depends
from bson import ObjectId
from app.models import UserStats
from app.auth import get_current_user_id
from app.database import get_profiles_collection, get_jobs_collection, get_saved_jobs_collection
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stats", tags=["Analytics"])


@router.get("", response_model=UserStats)
async def get_user_stats(current_user_id: str = Depends(get_current_user_id)):
    """
    Get user statistics and analytics
    
    Returns:
    - Total jobs available
    - Recommended jobs count
    - Saved jobs count
    - Profile completeness
    - Top matching skills
    - Skill coverage percentage
    """
    profiles = get_profiles_collection()
    jobs = get_jobs_collection()
    saved_jobs = get_saved_jobs_collection()
    
    # Get user profile
    profile = await profiles.find_one({"user_id": ObjectId(current_user_id)})
    
    if not profile:
        return UserStats(
            total_jobs_available=0,
            recommended_jobs=0,
            saved_jobs=0,
            profile_completeness=0,
            top_matching_skills=[],
            skill_coverage_percentage=0.0
        )
    
    # Total jobs available
    total_jobs = await jobs.count_documents({
        "expire_at": {"$gt": datetime.utcnow()}
    })
    
    # Recommended jobs (jobs matching user skills)
    user_skills = profile.get("skills", {}).get("all_skills_normalized", [])
    recommended_jobs = await jobs.count_documents({
        "required_skills": {"$in": user_skills},
        "expire_at": {"$gt": datetime.utcnow()}
    })
    
    # Saved jobs count
    saved_count = await saved_jobs.count_documents({
        "user_id": ObjectId(current_user_id)
    })
    
    # Profile completeness
    completeness = profile.get("profile_completeness", 0)
    
    # Top matching skills (skills that appear in most jobs)
    skill_matches = {}
    for skill in user_skills[:20]:  # Check top 20 skills
        count = await jobs.count_documents({
            "required_skills": skill,
            "expire_at": {"$gt": datetime.utcnow()}
        })
        if count > 0:
            skill_matches[skill] = count
    
    # Sort by count and get top 5
    top_skills = sorted(skill_matches.items(), key=lambda x: x[1], reverse=True)[:5]
    top_matching_skills = [skill for skill, _ in top_skills]
    
    # Skill coverage (percentage of user skills that match available jobs)
    if user_skills:
        skills_with_jobs = len([s for s in user_skills if skill_matches.get(s, 0) > 0])
        skill_coverage = (skills_with_jobs / len(user_skills)) * 100
    else:
        skill_coverage = 0.0
    
    return UserStats(
        total_jobs_available=total_jobs,
        recommended_jobs=recommended_jobs,
        saved_jobs=saved_count,
        profile_completeness=completeness,
        top_matching_skills=top_matching_skills,
        skill_coverage_percentage=round(skill_coverage, 2)
    )

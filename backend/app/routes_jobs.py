"""
Job recommendation and search API endpoints (Supabase Version)
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from app.models import JobRecommendation, Job, SavedJob
from app.auth import get_current_user_id
from app.database import get_profiles_collection, get_jobs_collection, get_saved_jobs_collection
from app.matching import job_matcher
# from bson import ObjectId # Removed

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("/recommendations", response_model=dict)
async def get_job_recommendations(
    limit: int = Query(20, ge=1, le=100),
    min_score: int = Query(30, ge=0, le=100),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get personalized job recommendations
    """
    profiles = get_profiles_collection()
    jobs = get_jobs_collection()
    
    # Get user profile
    res_profile = profiles.select("*").eq("user_id", current_user_id).execute()
    
    if not res_profile.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please upload your resume first."
        )
    
    profile_data = res_profile.data[0]
    
    # Convert to UserProfile model
    from app.models import UserProfile
    # Handle list vs array conversion if needed
    user_profile = UserProfile(**profile_data)
    
    # Get adjacent experience levels for filtering
    adjacent_levels = job_matcher.get_adjacent_levels(user_profile.experience_level)
    
    # Build query to fetch candidate jobs
    # Logical OR is tricky in Supabase across different fields easily in one query string?
    # actually `.or_` works.
    # We want (expire_at > NOW) AND (skills IN ... OR experience IN ...)
    # Supabase `or` applies to top level usually? 
    # Complex OR with AND is hard.
    # Let's fetch broader candidate set (last 200 jobs) and filter in Python for now.
    # PROTOTYPE HACK: Just fetch latest 200 jobs.
    
    res_jobs = jobs.select("*").order("posted_at", desc=True).limit(200).execute()
    candidate_jobs = res_jobs.data
    
    if not candidate_jobs:
        return {
            "recommendations": [],
            "total": 0,
            "message": "No matching jobs found."
        }
    
    # Score each job
    recommendations = []
    for job_doc in candidate_jobs:
        try:
            # Map fields if necessary
            job = Job(**job_doc)
            recommendation = job_matcher.create_recommendation(user_profile, job)
            
            if recommendation.match_score >= min_score:
                recommendations.append(recommendation)
        except Exception as e:
            # logger.warning(f"Failed to process job {job_doc.get('job_id')}: {str(e)}")
            continue
    
    # Sort by match score
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    
    # Limit results
    recommendations = recommendations[:limit]
    
    return {
        "recommendations": [rec.dict() for rec in recommendations],
        "total": len(recommendations)
    }


# Moved get_job_details to the end to prevent shadowing specific routes


@router.get("/search/filter", response_model=dict)
async def search_jobs(
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    remote_only: bool = Query(False),
    experience_level: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Search and filter jobs
    """
    jobs = get_jobs_collection()
    
    # Build query
    q = jobs.select("*", count="exact")
    
    if query:
        q = q.or_(f"role.ilike.%{query}%,company.ilike.%{query}%,description.ilike.%{query}%")
    
    if location:
        q = q.ilike("location", f"%{location}%")
    
    if remote_only:
        q = q.eq("is_remote", True)
    
    if experience_level:
        q = q.eq("experience_level", experience_level)
    
    # Execute
    res = q.order("posted_at", desc=True).range(skip, skip + limit - 1).execute()
    
    job_docs = res.data
    total = res.count if res.count is not None else len(job_docs)
    
    # Convert to dict (Supabase returns dicts already, but we ensure structure)
    formatted_jobs = []
    for job in job_docs:
        # id is already string usually
        formatted_jobs.append(job)
    
    return {
        "jobs": formatted_jobs,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/save", response_model=dict)
async def save_job(
    job_id: str,
    notes: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Save a job for later
    """
    jobs = get_jobs_collection()
    saved_jobs = get_saved_jobs_collection()
    
    # Verify job exists
    res_job = jobs.select("id").or_(f"id.eq.{job_id},job_id.eq.{job_id}").execute()
    
    if not res_job.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job_internal_id = res_job.data[0]["id"]
    
    # Check if already saved
    # user_id is implicit or explicit? Schema says user_id column.
    res_existing = saved_jobs.select("*").eq("user_id", current_user_id).eq("job_id", job_internal_id).execute()
    
    if res_existing.data:
        return {"message": "Job already saved"}
    
    # Save job
    new_saved = {
        "user_id": current_user_id,
        "job_id": job_internal_id,
        "notes": notes,
        "saved_at": datetime.utcnow().isoformat()
    }
    
    saved_jobs.insert(new_saved).execute()
    
    return {"message": "Job saved successfully"}


@router.delete("/save/{job_id}", response_model=dict)
async def unsave_job(
    job_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Remove a job from saved list"""
    saved_jobs = get_saved_jobs_collection()
    jobs = get_jobs_collection()
    
    # Resolve job_id to internal id if needed, or try direct delete
    # The job_id passed might be external ID or internal ID.
    
    # First find internal ID if external
    res_job = jobs.select("id").or_(f"id.eq.{job_id},job_id.eq.{job_id}").execute()
    if res_job.data:
         real_job_id = res_job.data[0]["id"]
    else:
         # Try using job_id as is (maybe it IS the UUID used in saved_jobs?)
         # But saved_jobs links to jobs.id (UUID).
         real_job_id = job_id

    # Delete
    res = saved_jobs.delete().eq("user_id", current_user_id).eq("job_id", real_job_id).execute()
    
    if not res.data:
         # Maybe fail silent or warn
         pass

    return {"message": "Job removed from saved list"}


@router.get("/saved/list", response_model=dict)
async def get_saved_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get all saved jobs
    """
    saved_jobs = get_saved_jobs_collection()
    
    # Join with jobs table? Supabase-py join support is 'select(..., jobs(...))'
    # We need foreign key relationship setup in Supabase for this to work elegantly.
    # Assuming 'job_id' is FK to 'jobs.id'.
    
    query = saved_jobs.select("*, jobs(*)").eq("user_id", current_user_id).order("saved_at", desc=True).range(skip, skip + limit - 1)
    
    res = query.execute()
    saved_records = res.data
    
    # Format
    saved_jobs_list = []
    for record in saved_records:
        if record.get("jobs"): # joined data
            job_data = record["jobs"]
            saved_jobs_list.append({
                "job": job_data,
                "saved_at": record["saved_at"],
                "notes": record.get("notes")
            })
    
    # Total count
    res_count = saved_jobs.select("*", count="exact").eq("user_id", current_user_id).execute()
    total = res_count.count
    
    return {
        "saved_jobs": saved_jobs_list,
        "total": total
    }


@router.get("/{job_id}", response_model=dict)
async def get_job_details(
    job_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get detailed job information with match analysis
    """
    profiles = get_profiles_collection()
    jobs = get_jobs_collection()
    
    # Get user profile
    res_profile = profiles.select("*").eq("user_id", current_user_id).execute()
    if not res_profile.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Get job
    res_job = jobs.select("*").or_(f"id.eq.{job_id},job_id.eq.{job_id}").execute()
    
    if not res_job.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job_doc = res_job.data[0]
    
    # Create models
    from app.models import UserProfile
    user_profile = UserProfile(**res_profile.data[0])
    job = Job(**job_doc)
    
    # Calculate match
    recommendation = job_matcher.create_recommendation(user_profile, job)
    
    # Generate recommendation text
    score = recommendation.match_score
    if score >= 80:
        recommendation_text = "Excellent match! You have most of the required skills."
    elif score >= 60:
        recommendation_text = "Good match! You meet many of the requirements."
    elif score >= 40:
        recommendation_text = "Moderate match. Consider applying if you're interested in learning."
    else:
        recommendation_text = "Lower match. You may need to develop more relevant skills."
    
    return {
        "job": recommendation.job,
        "match_analysis": {
            "score": recommendation.match_score,
            "percentage": recommendation.match_percentage,
            "matching_skills": recommendation.matching_skills,
            "missing_skills": recommendation.missing_skills,
            "experience_match": user_profile.experience_level == job.experience_level,
            "recommendation": recommendation_text
        }
    }

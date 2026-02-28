"""
Public and personalized job endpoints
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
# from bson import ObjectId # Removed
from typing import List, Optional
from datetime import datetime
from app.models import Job
from app.auth import get_current_user_id
from app.database import get_jobs_collection, get_profiles_collection

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

# Experience level hierarchy for matching
EXPERIENCE_HIERARCHY = {
    "0-1": 0,
    "1-3": 1,
    "3-5": 2,
    "5-8": 3,
    "8-12": 4,
    "12+": 5
}


def _parse_experience_level(exp_text: Optional[str]) -> Optional[int]:
    """
    Parse experience_level text to a numeric min-years value.
    Returns None if unparseable (meaning no requirement, always include).
    Examples:
        "Entry Level" -> 0
        "1-3 years" -> 1
        "3-5" -> 3
        "Senior" -> 5
        "Mid-Senior level" -> 3
        None -> None
    """
    if not exp_text or exp_text.strip() == "" or exp_text.lower() == "nan":
        return None

    exp_text = exp_text.strip().lower()

    # Direct range patterns like "1-3", "3-5 years", "0-2"
    import re
    range_match = re.match(r'(\d+)\s*[-–]\s*(\d+)', exp_text)
    if range_match:
        return int(range_match.group(1))

    # Single number like "2 years", "5+"
    single_match = re.match(r'(\d+)', exp_text)
    if single_match:
        return int(single_match.group(1))

    # Text labels
    label_map = {
        "entry": 0, "entry level": 0, "fresher": 0, "intern": 0, "internship": 0,
        "junior": 1, "associate": 1,
        "mid": 3, "mid-level": 3, "mid level": 3, "mid-senior": 3, "mid-senior level": 3,
        "senior": 5, "lead": 7, "principal": 8,
        "director": 10, "executive": 12, "vp": 12,
        "not applicable": None,
    }
    for label, val in label_map.items():
        if label in exp_text:
            return val

    return None

@router.get("/public", response_model=dict)
async def get_public_jobs(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    location: Optional[str] = Query(None),
    remote_only: bool = Query(False),
    search: Optional[str] = Query(None),
    search_type: Optional[str] = Query(None, description="Filter search by 'company' or 'role'"),
    experience: Optional[int] = Query(None, description="User experience in years; filters jobs where required exp <= experience+1")
):
    """
    Get all jobs without authentication (PUBLIC)
    Sorted by posted_at DESC (latest first)
    Optionally filtered by experience level
    """
    try:
        jobs = get_jobs_collection()
        
        # Build query using Supabase filters
        query = jobs.select("*", count="exact")
        
        if location:
            # ilike is case-insensitive like
            query = query.ilike("location", f"%{location}%")
        
        if remote_only:
            query = query.eq("is_remote", True)
        
        if search:
            if search_type == "company":
                query = query.ilike("company", f"%{search}%")
            elif search_type == "role":
                query = query.ilike("role", f"%{search}%")
            elif search_type == "skill":
                query = query.ilike("description", f"%{search}%")
            else:
                query = query.or_(f"role.ilike.%{search}%,company.ilike.%{search}%")
        
        # Sort and paginate
        res = query.order("posted_at", desc=True).range(skip, skip + limit - 1).execute()
        
        job_docs = res.data
        total = res.count if res.count is not None else len(job_docs)
        
        # Convert to response format and apply experience filter
        jobs_list = []
        for job in job_docs:
            try:
                # Experience filtering: if user provided experience, filter jobs
                if experience is not None:
                    job_exp = _parse_experience_level(job.get("experience_level"))
                    if job_exp is not None and job_exp > experience + 1:
                        continue  # Skip jobs requiring more experience than user has + 1

                posted_at = job.get("posted_at")
                if posted_at and isinstance(posted_at, str):
                    pass # Keep as string
                elif posted_at and isinstance(posted_at, datetime):
                     posted_at = posted_at.isoformat()
                
                jobs_list.append({
                    "id": str(job.get("id")),
                    "job_id": job.get("job_id"),
                    "company": job.get("company", "Unknown"),
                    "role": job.get("role", "Unknown Role"),
                    "location": job.get("location", "Remote/Unknown"),
                    "is_remote": job.get("is_remote", False),
                    "type": job.get("job_type", "Full-time"), # mapped job_type from table
                    "experience": job.get("experience_level"), # mapped experience_level
                    "salary": job.get("salary_range"), # mapped salary_range
                    "posted_at": posted_at,
                    "url": job.get("source_url")
                })
            except Exception as e:
                logger.error(f"Error parsing job row {job.get('id')}: {e}")
                continue
        
        return {
            "jobs": jobs_list,
            "total": total if experience is None else len(jobs_list),
            "has_more": (skip + limit) < total if experience is None else False,
            "showing": len(jobs_list)
        }
    except Exception as e:
        logger.error(f"Error in get_public_jobs: {e}")
        # Fallback to mock data for prototype if DB is down
        logger.warning("Using MOCK DATA due to DB error")
        mock_jobs = [
            {
                "id": "mock-1",
                "job_id": "mock-1",
                "company": "TechCorp (Mock)",
                "role": "Frontend Developer",
                "location": "Bengaluru",
                "is_remote": True,
                "type": "Full-time",
                "experience": "1-3 years",
                "salary": "₹12L - ₹18L",
                "posted_at": datetime.now().isoformat(),
                "url": "#"
            },
            {
                "id": "mock-2",
                "job_id": "mock-2",
                "company": "InnovateAI (Mock)",
                "role": "Machine Learning Engineer",
                "location": "Remote",
                "is_remote": True,
                "type": "Contract",
                "experience": "3-5 years",
                "salary": "$4000 - $6000",
                "posted_at": datetime.now().isoformat(),
                "url": "#"
            }
        ]
        return {
            "jobs": mock_jobs,
            "total": len(mock_jobs),
            "has_more": False,
            "showing": len(mock_jobs)
        }


@router.get("/public/{job_id}", response_model=dict)
async def get_public_job_details(job_id: str):
    """
    Get detailed job information without authentication (PUBLIC)
    """
    jobs = get_jobs_collection()
    
    # Try to find by id (internal uuid) or job_id (external)
    # Since we can't easily check 'is_uuid', we'll try job_id first, then id?
    # Actually, Supabase ID is UUID.
    # We'll search OR
    res = jobs.select("*").or_(f"id.eq.{job_id},job_id.eq.{job_id}").execute()

    if not res.data:
         # Maybe invalid UUID format caused 500? If so, we catch or just return 404
         # supabase-py might raise error on invalid UUID syntax.
         # Ideally we fallback.
         pass
    
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
        
    job = res.data[0]
    
    return {
        "job": {
            "id": job["id"],
            "job_id": job.get("job_id"),
            "company": job["company"],
            "role": job["role"],
            "description": job.get("description", ""),
            "location": job["location"],
            "is_remote": job.get("is_remote", False),
            "type": job.get("job_type", "Full-time"),
            "experience": job.get("experience_level"),
            "salary": job.get("salary_range"),
            "posted_at": job.get("posted_at"),
            "url": job.get("source_url")
        }
    }


@router.get("/personalized", response_model=dict)
async def get_personalized_jobs(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    search: Optional[str] = None,
    search_type: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get jobs personalized to user profile (REQUIRES AUTH)
    Scores jobs by: skills (50pts), role (25pts), location (15pts), experience (10pts) = 100pts
    """
    profiles = get_profiles_collection()
    jobs = get_jobs_collection()
    
    # Get user profile
    res = profiles.select("*").eq("user_id", current_user_id).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete your profile."
        )
    profile = res.data[0]
    
    # Get user data
    user_experience = profile.get("experience_years") or 0
    preferred_role = profile.get("preferred_role", "")
    preferred_location = profile.get("preferred_location", "")
    
    # Get user skills — try top-level 'skills' column first, fallback to parsed_data
    user_skills_raw = profile.get("skills") or []
    if not user_skills_raw:
        parsed = profile.get("parsed_data") or {}
        skills_data = parsed.get("skills", {})
        user_skills_raw = skills_data.get("all_skills_normalized", [])
        if not user_skills_raw:
            # Flatten from categories
            user_skills_raw = (
                skills_data.get("technical", []) +
                skills_data.get("programming_languages", []) +
                skills_data.get("tools_frameworks", [])
            )
    
    user_skills = set(s.lower().strip() for s in user_skills_raw if s)
    
    logger.info(f"Personalized jobs for user {current_user_id}: {len(user_skills)} skills, role={preferred_role}, exp={user_experience}")
    
    # Build query
    query = jobs.select("*")
    if search:
        if search_type == "company":
            query = query.ilike("company", f"%{search}%")
        elif search_type == "role":
            query = query.ilike("role", f"%{search}%")
        elif search_type == "skill":
            query = query.ilike("description", f"%{search}%")
        else:
            query = query.or_(f"role.ilike.%{search}%,company.ilike.%{search}%,description.ilike.%{search}%")
        
    res_jobs = query.order("posted_at", desc=True).limit(2000).execute()
    all_jobs = res_jobs.data
    
    # Score each job
    scored_jobs = []
    for job in all_jobs:
        score, matching_skills = _score_job(
            job, user_experience, preferred_role, preferred_location, user_skills
        )
        
        scored_jobs.append({
            "job": job,
            "score": score,
            "matching_skills": matching_skills,
            "match_reason": _build_match_reason(score, matching_skills, preferred_role, job)
        })
    
    # Sort by score DESC then posted_at DESC
    scored_jobs.sort(key=lambda x: (-x["score"], -(x["job"].get("posted_at") or "").__hash__()))
    
    # Paginate
    paginated = scored_jobs[skip:skip+limit]
    
    # Format response
    jobs_list = []
    for item in paginated:
        job = item["job"]
        jobs_list.append({
            "id": job["id"],
            "job_id": job.get("job_id"),
            "company": job["company"],
            "role": job["role"],
            "location": job["location"],
            "is_remote": job.get("is_remote", False),
            "type": job.get("job_type", "Full-time"),
            "experience": job.get("experience_level"),
            "salary": job.get("salary_range"),
            "posted_at": job.get("posted_at"),
            "match_score": item["score"],
            "match_percentage": f"{min(int(item['score']), 100)}%",
            "matching_skills": item["matching_skills"][:5],
            "match_reason": item["match_reason"],
            "url": job.get("source_url")
        })
    
    return {
        "jobs": jobs_list,
        "total": len(scored_jobs),
        "showing": len(jobs_list),
        "has_more": (skip + limit) < len(scored_jobs),
        "filters_applied": {
            "experience": user_experience,
            "preferred_role": preferred_role,
            "preferred_location": preferred_location,
            "skills_count": len(user_skills)
        }
    }


def _extract_skills_from_description(description: str, user_skills: set) -> list:
    """
    Find user skills mentioned in a job description text.
    Returns list of matched skill strings.
    """
    if not description or not user_skills:
        return []
    
    desc_lower = description.lower()
    matched = []
    for skill in user_skills:
        # Match whole word boundaries to avoid false positives
        # e.g. "r" shouldn't match "requirements"
        if len(skill) <= 2:
            # For very short skills (C, R, Go), require exact boundaries
            import re
            if re.search(r'\b' + re.escape(skill) + r'\b', desc_lower):
                matched.append(skill)
        else:
            if skill in desc_lower:
                matched.append(skill)
    return matched


def _score_job(job, user_experience, preferred_role, preferred_location, user_skills):
    """
    Score a job against user profile.
    Returns (score: int, matching_skills: list)
    
    Scoring: Skills 50pts, Role 25pts, Location 15pts, Experience 10pts = 100pts max
    """
    score = 0
    matching_skills = []
    
    # === SKILLS MATCHING (50 pts max) ===
    # Get skills from the job's skills_required column
    job_skills_col = set(s.lower() for s in (job.get("skills_required") or []))
    
    # Also extract from description
    desc_skills = _extract_skills_from_description(job.get("description", ""), user_skills)
    
    # Combine all matched skills
    all_matched = set()
    if user_skills and job_skills_col:
        all_matched.update(user_skills & job_skills_col)
    all_matched.update(desc_skills)
    
    matching_skills = list(all_matched)
    
    if matching_skills:
        # Count-based scoring: more matched skills = higher score
        n = len(matching_skills)
        if n >= 7:
            score += 50
        elif n >= 5:
            score += 40
        elif n >= 3:
            score += 30
        elif n >= 2:
            score += 20
        else:
            score += 10
    
    # === ROLE MATCHING (25 pts) ===
    job_role = (job.get("role") or "").lower()
    if preferred_role:
        role_lower = preferred_role.lower()
        # Split role into keywords for flexible matching
        role_keywords = [w for w in role_lower.replace("-", " ").split() if len(w) > 2]
        matched_keywords = sum(1 for kw in role_keywords if kw in job_role)
        if matched_keywords > 0:
            score += min(int((matched_keywords / max(len(role_keywords), 1)) * 25), 25)
    
    # === LOCATION MATCHING (15 pts) ===
    if job.get("is_remote"):
        score += 15  # Remote jobs match everyone
    elif preferred_location:
        job_loc = (job.get("location") or "").lower()
        if preferred_location.lower() in job_loc:
            score += 15
    
    # === EXPERIENCE MATCHING (10 pts) ===
    job_exp = _parse_experience_level(job.get("experience_level"))
    exp_is_fit = False
    if job_exp is not None:
        if job_exp <= user_experience + 1:
            score += 10  # Good fit
            exp_is_fit = True
        elif job_exp <= user_experience + 3:
            score += 5   # Stretch but possible
            exp_is_fit = True
        # If job requires way more experience, no points
    else:
        score += 5  # No requirement = neutral
        exp_is_fit = True
        
    # === FAANG AND HIGH SALARY BONUS (Up to 40 bonus pts) ===
    # Add significant bonus to sort these higher, but only if they fit the user's experience
    if exp_is_fit:
        # FAANG / Top Tech bonus (25 pts)
        faang_companies = {"google", "amazon", "microsoft", "meta", "apple", "netflix", "uber", "airbnb", "stripe", "linkedin", "atlassian", "salesforce", "oracle", "nvidia"}
        job_company = (job.get("company") or "").lower()
        if any(fc in job_company for fc in faang_companies):
            score += 25
            
        # High Salary bonus (15 pts)
        salary_str = (job.get("salary") or "").lower()
        if salary_str:
            high_pay_keywords = ["100k", "120k", "150k", "200k", "250k", "300k", 
                                "30l", "40l", "50l", "60l", "100,000", "150,000", "200,000", "crore", "cr"]
            if any(k in salary_str for k in high_pay_keywords):
                score += 15
            elif "$" in salary_str and any(c.isdigit() for c in salary_str):
                # Generous fallback: any dollar amount often signifies a higher paying/global job
                score += 10
    
    return score, matching_skills


def _build_match_reason(score, matching_skills, preferred_role, job):
    """Generate human-readable match reason"""
    reasons = []
    
    if matching_skills:
        if len(matching_skills) >= 5:
            reasons.append(f"{len(matching_skills)} skills match")
        elif len(matching_skills) >= 2:
            reasons.append(f"{', '.join(matching_skills[:3])} match")
        else:
            reasons.append(f"{matching_skills[0]} matches")
    
    job_role = (job.get("role") or "").lower()
    if preferred_role and preferred_role.lower() in job_role:
        reasons.append("Preferred role")
    
    if job.get("is_remote"):
        reasons.append("Remote")
        
    faang_companies = {"google", "amazon", "microsoft", "meta", "apple", "netflix", "uber", "airbnb", "stripe", "linkedin", "atlassian", "salesforce", "oracle", "nvidia"}
    job_company = (job.get("company") or "").lower()
    if any(fc in job_company for fc in faang_companies):
        reasons.append("Top Tech")
        
    salary_str = (job.get("salary") or "").lower()
    if salary_str:
        high_pay_keywords = ["100k", "120k", "150k", "200k", "250k", "300k", 
                            "30l", "40l", "50l", "60l", "100,000", "150,000", "200,000", "crore", "cr"]
        if any(k in salary_str for k in high_pay_keywords) or ("$" in salary_str and any(c.isdigit() for c in salary_str)):
            reasons.append("High Pay")
    
    if score >= 70:
        return "🔥 Excellent match! " + ", ".join(reasons[:2])
    elif score >= 45:
        return "✅ Good match: " + ", ".join(reasons[:2])
    elif score >= 20:
        return "💡 " + (reasons[0] if reasons else "Consider applying")
    else:
        return "Available position"


@router.post("/{job_id}/apply", response_model=dict)
async def apply_to_job(
    job_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Apply to a job (REQUIRES AUTH)
    """
    jobs = get_jobs_collection()
    
    # Verify job exists
    # Use OR search
    res = jobs.select("*").or_(f"id.eq.{job_id},job_id.eq.{job_id}").execute()

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = res.data[0]
    
    # TODO: Store application in database
    
    return {
        "message": "Application submitted successfully",
        "job": {
            "company": job["company"],
            "role": job["role"]
        },
        "next_steps": "The employer will review your application and contact you if interested."
    }

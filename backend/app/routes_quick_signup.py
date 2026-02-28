"""
Quick signup endpoint for streamlined onboarding
"""
import logging
import traceback
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
# from bson import ObjectId # Removed
from datetime import datetime
from app.models import UserInDB, Token
from app.auth import hash_password, create_access_token, get_current_user_id
from app.database import get_users_collection, get_profiles_collection
from app.file_handler import file_handler
from app.resume_parser import resume_parser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication - Quick Signup"])




async def parse_and_enhance_profile(file_path: str, user_id: str):
    """Background task to parse resume and enhance profile"""
    try:
        logger.info(f"Starting resume parsing for user {user_id}")
        
        # Parse resume
        profile_data = await resume_parser.parse_resume(file_path, user_id)
        
        # Get existing profile
        profiles = get_profiles_collection()
        res = profiles.select("*").eq("user_id", user_id).execute()
        existing_profile = res.data[0] if res.data else None
        
        if existing_profile:
            # Merge parsed data with existing profile
            # Extract all skills as a flat list for the top-level 'skills' column
            all_skills = []
            skills_obj = profile_data.skills
            if skills_obj:
                all_skills.extend(skills_obj.technical or [])
                all_skills.extend(skills_obj.programming_languages or [])
                all_skills.extend(skills_obj.tools_frameworks or [])
            all_skills_normalized = list(set(s.lower().strip() for s in all_skills if s))
            
            update_data = {
                "parsing_status": "complete",
                "skills": all_skills_normalized,  # Store in top-level column for matching
                "parsed_data": {
                    "personal_info": profile_data.personal_info.dict(),
                    "skills": profile_data.skills.dict(),
                    "work_experience": [exp.dict() for exp in profile_data.work_experience],
                    "education": [edu.dict() for edu in profile_data.education],
                    "certifications": [cert.dict() for cert in profile_data.certifications],
                    "projects": [proj.dict() for proj in profile_data.projects],
                    "summary": profile_data.summary
                }
            }
            
            # Update experience_years from parsed resume if more accurate
            if profile_data.total_years_experience and profile_data.total_years_experience > 0:
                update_data["experience_years"] = int(profile_data.total_years_experience)
            
            profiles.update(update_data).eq("user_id", user_id).execute()
            
            logger.info(f"Profile enhanced for user {user_id}")
        
    except Exception as e:
        logger.error(f"Resume parsing failed for user {user_id}: {str(e)}")
        # Update profile with error status
        profiles = get_profiles_collection()
        profiles.update({
             "parsing_status": "failed",
             "parsed_data": {"error": str(e)}
        }).eq("user_id", user_id).execute()


@router.post("/quick-signup", response_model=dict)
async def quick_signup(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    password: str = Form(...),
    resume: UploadFile = File(...),
    experience_years: int = Form(...),
    preferred_role: str = Form(...),
    preferred_location: str = Form(default="Remote"),
    name: str = Form(default="")
):
    """
    Quick signup - streamlined onboarding with minimal fields
    """
    try:
        users = get_users_collection()
        profiles = get_profiles_collection()
        
        
        # Check if user already exists
        res = users.select("*").eq("email", email.lower()).execute()
        if res.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered. Please login instead."
            )
        
        # Validate password
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        # Create user
        new_user = {
            "email": email.lower(),
            "password_hash": hash_password(password),
            "name": name or email.split('@')[0],
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        
        res = users.insert(new_user).execute()
        if not res.data:
             raise HTTPException(status_code=500, detail="Failed to create user")
             
        user = res.data[0]
        user_id = user['id']
        
        try:
            # Save resume file
            file_path = await file_handler.save_resume(resume, user_id)
            
            # Update user with file path? Skipped, using profile.resume_url
            
            # Create basic profile with onboarding data
            basic_profile = {
                "user_id": user_id,
                "experience_years": experience_years,
                "preferred_role": preferred_role,
                "preferred_location": preferred_location,
                "resume_url": file_path,
                "parsing_status": "parsing",
                "parsed_data": {
                    "personal_info": {"email": email.lower()},
                    "skills": {"all_skills": []}
                },
                "created_at": datetime.utcnow().isoformat()
            }
            
            profiles.insert(basic_profile).execute()
            
            # Start background resume parsing
            background_tasks.add_task(parse_and_enhance_profile, file_path, user_id)
            
        except HTTPException as e:
            users.delete().eq("id", user_id).execute()
            raise e
        except Exception as e:
            users.delete().eq("id", user_id).execute()
            logger.error(f"Signup failed for {email}: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Signup failed: {str(e)}"
            )
        
        # Generate access token
        access_token = create_access_token(data={"sub": str(user_id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user_id),
                "email": email.lower(),
                "profile_status": "parsing"
            },
            "message": "Account created successfully! We're analyzing your resume to personalize your job recommendations."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick signup error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup error: {str(e)}"
        )


@router.get("/profile/status", response_model=dict)
async def get_profile_status(current_user_id: str = Depends(get_current_user_id)):
    """
    Get current profile parsing status
    """
    profiles = get_profiles_collection()
    res = profiles.select("*").eq("user_id", current_user_id).execute()
    
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    profile = res.data[0]
    # Handle parsed_data being None or dict
    user_skills_raw = profile.get("skills") or {}
    all_skills = []
    
    if isinstance(user_skills_raw, dict):
        all_skills = user_skills_raw.get("all_skills_normalized", [])
        if not all_skills:
            all_skills = (
                user_skills_raw.get("technical", []) +
                user_skills_raw.get("programming_languages", []) +
                user_skills_raw.get("tools_frameworks", [])
            )
    
    if not all_skills:
        parsed_data = profile.get("parsed_data") or {}
        skills = parsed_data.get("skills", {})
        all_skills = skills.get("all_skills", []) or skills.get("all_skills_normalized", [])
    
    exp_years = profile.get("total_years_experience")
    if exp_years is None:
        exp_years = profile.get("experience_years", 0)
        
    return {
        "parsing_status": profile.get("parsing_status", "pending"),
        "profile_completeness": profile.get("profile_completeness", 30),
        "experience_years": str(exp_years),
        "preferred_role": profile.get("preferred_role"),
        "preferred_location": profile.get("preferred_location"),
        "skills_count": len(all_skills),
        "skills": all_skills
    }

"""
Profile management API endpoints
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from bson import ObjectId
from app.models import ProfileResponse, UserProfile
from app.auth import get_current_user_id
from app.database import get_profiles_collection, get_users_collection
from app.file_handler import file_handler
from app.resume_parser import resume_parser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("", response_model=ProfileResponse)
async def get_profile(current_user_id: str = Depends(get_current_user_id)):
    """
    Get current user's profile
    
    Returns complete profile with all parsed resume data
    """
    profiles = get_profiles_collection()
    
    profile = await profiles.find_one({"user_id": ObjectId(current_user_id)})
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Resume may still be processing."
        )
    
    # Convert to response model
    profile["user_id"] = str(profile["user_id"])
    
    return ProfileResponse(**profile)


@router.put("/update", response_model=dict)
async def update_profile(
    profile_updates: dict,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Update profile fields manually
    
    Allows users to edit their profile information
    """
    profiles = get_profiles_collection()
    
    # Remove fields that shouldn't be updated directly
    protected_fields = ["user_id", "_id", "parsing_status", "parsing_errors"]
    for field in protected_fields:
        profile_updates.pop(field, None)
    
    if not profile_updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    result = await profiles.update_one(
        {"user_id": ObjectId(current_user_id)},
        {"$set": profile_updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return {"message": "Profile updated successfully"}


@router.post("/resume/reupload", response_model=dict)
async def reupload_resume(
    background_tasks: BackgroundTasks,
    resume: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Upload a new resume and re-parse
    
    - **resume**: New resume file (PDF, DOCX, DOC, TXT, RTF - max 10MB)
    """
    users = get_users_collection()
    profiles = get_profiles_collection()
    
    # Get current user
    user = await users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete old resume file if exists
    if user.get("resume_file_path"):
        file_handler.delete_resume(user["resume_file_path"])
    
    # Save new resume
    file_path = await file_handler.save_resume(resume, current_user_id)
    
    # Update user
    await users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": {"resume_file_path": file_path}}
    )
    
    # Update profile status to processing
    await profiles.update_one(
        {"user_id": ObjectId(current_user_id)},
        {"$set": {"parsing_status": "processing"}},
        upsert=True
    )
    
    # Start background parsing
    from app.routes_auth import parse_resume_background
    background_tasks.add_task(parse_resume_background, file_path, current_user_id)
    
    return {
        "message": "Resume uploaded successfully. Parsing in progress.",
        "parsing_status": "processing"
    }


@router.get("/skills", response_model=dict)
async def get_skills(current_user_id: str = Depends(get_current_user_id)):
    """
    Get all user skills categorized
    
    Returns skills organized by category
    """
    profiles = get_profiles_collection()
    
    profile = await profiles.find_one(
        {"user_id": ObjectId(current_user_id)},
        {"skills": 1}
    )
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return profile.get("skills", {})


@router.get("/completeness", response_model=dict)
async def get_profile_completeness(current_user_id: str = Depends(get_current_user_id)):
    """
    Get profile completeness score and suggestions
    
    Returns percentage and missing fields
    """
    profiles = get_profiles_collection()
    
    profile = await profiles.find_one({"user_id": ObjectId(current_user_id)})
    
    if not profile:
        return {
            "completeness": 0,
            "suggestions": ["Upload your resume to get started"]
        }
    
    completeness = profile.get("profile_completeness", 0)
    suggestions = []
    
    # Generate suggestions
    if not profile.get("personal_info", {}).get("phone"):
        suggestions.append("Add your phone number")
    
    if not profile.get("personal_info", {}).get("linkedin_url"):
        suggestions.append("Add your LinkedIn profile")
    
    if len(profile.get("skills", {}).get("all_skills_normalized", [])) < 5:
        suggestions.append("Add more skills to improve job matching")
    
    if not profile.get("work_experience"):
        suggestions.append("Add your work experience")
    
    if not profile.get("education"):
        suggestions.append("Add your education details")
    
    return {
        "completeness": completeness,
        "suggestions": suggestions if completeness < 100 else ["Your profile is complete!"]
    }

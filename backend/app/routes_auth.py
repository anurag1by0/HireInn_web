"""
Authentication API endpoints
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.security import HTTPBearer
# from bson import ObjectId # Removed
from datetime import datetime
from app.models import UserRegister, UserLogin, Token, UserResponse, UserInDB
from app.auth import hash_password, verify_password, create_access_token, get_current_user_id
from app.database import get_users_collection, get_profiles_collection
from app.file_handler import file_handler
from app.resume_parser import resume_parser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()


async def parse_resume_background(file_path: str, user_id: str):
    """Background task to parse resume"""
    try:
        logger.info(f"Starting resume parsing for user {user_id}")
        
        # Parse resume
        profile_data = await resume_parser.parse_resume(file_path, user_id)
        
        # Save profile to database (Supabase)
        profiles = get_profiles_collection()
        profile_dict = profile_data.dict(by_alias=True, exclude={"id"})
        profile_dict["user_id"] = user_id
        # Convert list to array if needed needed by Postgres, but supabase-py handles list->json/array
        
        # Upsert profile
        profiles.upsert(profile_dict, on_conflict="user_id").execute()
        
        # Update user's resume_parsed_at (Supabase local_users doesn't have resume_parsed_at yet? 
        # Schema I gave didn't have it. Let's skip or store in profile)
        # We'll skip for now or update profile metadata.
        
        logger.info(f"Resume parsing completed for user {user_id}")
        
    except Exception as e:
        logger.error(f"Resume parsing failed for user {user_id}: {str(e)}")
        # Update profile with error status
        profiles = get_profiles_collection()
        profiles.upsert({
            "user_id": user_id,
            "parsing_status": "failed",
            "parsed_data": {"error": str(e)}
        }, on_conflict="user_id").execute()


@router.post("/register", response_model=dict)
async def register(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    password: str = Form(...),
    resume: UploadFile = File(...)
):
    """
    Register a new user with resume upload
    """
    users = get_users_collection()
    
    # Check if user already exists
    res = users.select("*").eq("email", email.lower()).execute()
    if res.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password
    try:
        user_data = UserRegister(email=email, password=password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Create user
    new_user = {
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Insert
    res = users.insert(new_user).execute()
    if not res.data:
         raise HTTPException(status_code=500, detail="Failed to create user")
         
    user = res.data[0] # The created row
    user_id = user['id']
    
    # Save resume file
    try:
        file_path = await file_handler.save_resume(resume, user_id)
        
        # Update user with file path? Or profile?
        # My schema for local_users didn't have resume_file_path.
        # But profiles table has resume_url.
        # Let's verify `create_tables.py` schema.
        # `profiles` has `resume_url`.
        
        # Init profile with resume_url
        profiles = get_profiles_collection()
        profiles.insert({
            "user_id": user_id,
            "resume_url": file_path,
            "parsing_status": "pending"
        }).execute()
        
        # Start background parsing
        background_tasks.add_task(parse_resume_background, file_path, user_id)
        
    except HTTPException as e:
        # Delete user if file upload fails
        users.delete().eq("id", user_id).execute()
        raise e
    except Exception as e:
        users.delete().eq("id", user_id).execute()
        raise HTTPException(status_code=500, detail=str(e))
    
    # Generate token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user['email'],
            "profile_status": "parsing"
        }
    }


from pydantic import BaseModel as BaseModelV2

class LoginRequest(BaseModelV2):
    email: str
    password: str

class GoogleLoginRequest(BaseModelV2):
    email: str
    name: str = None
    google_id: str

@router.post("/google")
async def google_login(data: GoogleLoginRequest):
    """
    Login or Register via Google OAuth
    """
    users = get_users_collection()
    
    # Check if user exists by email
    res = users.select("*").eq("email", data.email.lower()).execute()
    
    if res.data:
        user = res.data[0]
        users.update({"last_login": datetime.utcnow().isoformat()}).eq("id", user["id"]).execute()
    else:
        # Register new Google User
        new_user = {
            "email": data.email.lower(),
            "password_hash": "GOOGLE_OAUTH",
            "name": data.name or data.email.split('@')[0],
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        ins_res = users.insert(new_user).execute()
        if not ins_res.data:
            raise HTTPException(status_code=500, detail="Failed to create Google user")
            
        user = ins_res.data[0]
        user_id = user["id"]
        
        # Initialize basic profile
        profiles = get_profiles_collection()
        profiles.insert({
            "user_id": user_id,
            "experience_years": 0,
            "preferred_role": "",
            "preferred_location": "",
            "parsing_status": "complete",
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
    access_token = create_access_token(data={"sub": str(user["id"])})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user["id"], "email": user["email"], "name": user.get("name")}
    }

@router.post("/login")
async def login(credentials: LoginRequest):
    """
    Login with email and password
    """
    users = get_users_collection()
    
    # Find user
    res = users.select("*").eq("email", credentials.email.lower()).execute()
    
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user = res.data[0]
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if account is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Update last login
    users.update({"last_login": datetime.utcnow().isoformat()}).eq("id", user["id"]).execute()
    
    # Generate token
    access_token = create_access_token(data={"sub": str(user["id"])})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(current_user_id: str = Depends(get_current_user_id)):
    """
    Logout (client should delete token)
    """
    return {"message": "Logged out successfully"}


@router.patch("/profile/update")
async def update_profile(
    background_tasks: BackgroundTasks,
    preferred_role: str = Form(None),
    preferred_location: str = Form(None),
    resume: UploadFile = File(None),
    current_user_id: str = Depends(get_current_user_id)
):
    """Update user profile preferences and/or resume"""
    profiles = get_profiles_collection()
    
    # Get existing profile
    res = profiles.select("*").eq("user_id", current_user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    update_data = {}
    if preferred_role is not None:
        update_data["preferred_role"] = preferred_role
    if preferred_location is not None:
        update_data["preferred_location"] = preferred_location
        
    if resume and resume.filename:
        # Save new resume
        try:
            file_path = await file_handler.save_resume(resume, current_user_id)
            update_data["resume_url"] = file_path
            update_data["parsing_status"] = "pending"
            # Start background parsing
            background_tasks.add_task(parse_resume_background, file_path, current_user_id)
        except Exception as e:
            logger.error(f"Failed to save updated resume: {e}")
            raise HTTPException(status_code=500, detail="Failed to save resume")
            
    if update_data:
        profiles.update(update_data).eq("user_id", current_user_id).execute()
        
    return {"message": "Profile updated successfully", "status": "pending" if resume and resume.filename else "complete"}


@router.get("/me")
async def get_current_user(current_user_id: str = Depends(get_current_user_id)):
    """Get current user information"""
    users = get_users_collection()
    profiles = get_profiles_collection()
    
    # User
    res = users.select("*").eq("id", current_user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = res.data[0]
    
    # Profile
    res_p = profiles.select("parsing_status, experience_years").eq("user_id", current_user_id).execute()
    profile_status = "pending"
    experience_years = None
    if res_p.data:
        profile_status = res_p.data[0].get("parsing_status", "pending")
        experience_years = res_p.data[0].get("experience_years")
    
    return {
        "id": str(user["id"]),
        "email": user["email"],
        "name": user.get("name") or user["email"].split('@')[0],
        "created_at": str(user.get("created_at", "")),
        "profile_status": profile_status,
        "experience_years": experience_years
    }

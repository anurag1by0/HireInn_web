"""
API endpoint to get dropdown options and constants
"""
from fastapi import APIRouter
from app.constants import (
    EXPERIENCE_LEVELS,
    ENGINEERING_ROLES,
    LOCATIONS,
    JOB_TYPES,
    WORK_MODES,
    SALARY_RANGES,
    NOTICE_PERIODS,
    EDUCATION_LEVELS,
    COMMON_SKILLS
)

router = APIRouter(prefix="/api/constants", tags=["Constants"])


@router.get("/experience-levels", response_model=list)
async def get_experience_levels():
    """Get all experience level options for dropdown"""
    return EXPERIENCE_LEVELS


@router.get("/roles", response_model=list)
async def get_engineering_roles():
    """Get all engineering role options for dropdown"""
    return sorted(ENGINEERING_ROLES)


@router.get("/locations", response_model=list)
async def get_locations():
    """Get all location options for dropdown"""
    return LOCATIONS


@router.get("/job-types", response_model=list)
async def get_job_types():
    """Get all job type options"""
    return JOB_TYPES


@router.get("/work-modes", response_model=list)
async def get_work_modes():
    """Get all work mode options"""
    return WORK_MODES


@router.get("/salary-ranges", response_model=list)
async def get_salary_ranges():
    """Get all salary range options"""
    return SALARY_RANGES


@router.get("/notice-periods", response_model=list)
async def get_notice_periods():
    """Get all notice period options"""
    return NOTICE_PERIODS


@router.get("/education-levels", response_model=list)
async def get_education_levels():
    """Get all education level options"""
    return EDUCATION_LEVELS


@router.get("/skills", response_model=list)
async def get_common_skills():
    """Get common technical skills for autocomplete"""
    return sorted(COMMON_SKILLS)


@router.get("/all", response_model=dict)
async def get_all_constants():
    """Get all constants in one call (for initial app load)"""
    return {
        "experience_levels": EXPERIENCE_LEVELS,
        "roles": sorted(ENGINEERING_ROLES),
        "locations": LOCATIONS,
        "job_types": JOB_TYPES,
        "work_modes": WORK_MODES,
        "salary_ranges": SALARY_RANGES,
        "notice_periods": NOTICE_PERIODS,
        "education_levels": EDUCATION_LEVELS,
        "common_skills": sorted(COMMON_SKILLS)
    }

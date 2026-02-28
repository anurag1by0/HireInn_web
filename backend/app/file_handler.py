"""
File upload and validation utilities
"""
import os
import uuid
import logging
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.config import settings

logger = logging.getLogger(__name__)


class FileHandler:
    """Handle file uploads with validation"""
    
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_resume(self, file: UploadFile, user_id: str) -> str:
        """
        Save uploaded resume file
        
        Args:
            file: Uploaded file
            user_id: User ID for organizing files
            
        Returns:
            Path to saved file
            
        Raises:
            HTTPException: If validation fails
        """
        # Validate file
        await self.validate_resume_file(file)
        
        # Create user directory
        user_dir = self.upload_dir / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_ext = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = user_dir / unique_filename
        
        # Save file
        try:
            content = await file.read()
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            logger.info(f"Saved resume for user {user_id}: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Failed to save file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file"
            )
    
    async def validate_resume_file(self, file: UploadFile):
        """
        Validate uploaded resume file
        
        Args:
            file: Uploaded file
            
        Raises:
            HTTPException: If validation fails
        """
        # Check if file exists
        if not file or not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        await file.seek(0)  # Reset to beginning
        
        if file_size > settings.MAX_FILE_SIZE:
            max_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {max_mb}MB"
            )
        
        # Validate MIME type
        content_type = file.content_type
        valid_types = {
            ".pdf": ["application/pdf"],
            ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
            ".doc": ["application/msword"],
            ".txt": ["text/plain"],
            ".rtf": ["application/rtf", "text/rtf"]
        }
        
        expected_types = valid_types.get(file_ext, [])
        if content_type and expected_types and content_type not in expected_types:
            logger.warning(f"MIME type mismatch: {content_type} for {file_ext}")
            # Don't fail, just log warning (some browsers send incorrect MIME types)
    
    def delete_resume(self, file_path: str):
        """Delete a resume file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted resume: {file_path}")
        except Exception as e:
            logger.error(f"Failed to delete file {file_path}: {str(e)}")


# Global instance
file_handler = FileHandler()

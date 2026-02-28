"""
Resume parsing service using Groq LLM, PyMuPDF, and Tesseract OCR
"""
import json
import logging
from pathlib import Path
from typing import Dict, Optional, Tuple
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from docx import Document
import docx2txt  # For DOC files
from groq import Groq
from app.config import settings
from app.models import UserProfile, PersonalInfo, Skills, WorkExperience, Education, Certification, Project
from datetime import datetime
from dateutil import parser as date_parser
import re

logger = logging.getLogger(__name__)

# Initialize Groq client
groq_client = Groq(api_key=settings.GROQ_API_KEY)


class ResumeParser:
    """Resume parsing service with multi-format support and LLM-based extraction"""
    
    def __init__(self):
        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
    
    async def parse_resume(self, file_path: str, user_id: str) -> UserProfile:
        """
        Main entry point for resume parsing
        
        Args:
            file_path: Path to the uploaded resume file
            user_id: User ID for the profile
            
        Returns:
            UserProfile object with parsed data
        """
        try:
            # Extract text from file
            text = await self.extract_text(file_path)
            
            if not text or len(text.strip()) < 100:
                raise ValueError("Insufficient text extracted from resume")
            
            # Parse with Groq LLM
            parsed_data = await self.parse_with_groq(text)
            
            # Create UserProfile
            profile = await self.create_profile_from_parsed_data(parsed_data, user_id)
            
            profile.parsing_status = "success"
            return profile
            
        except Exception as e:
            logger.error(f"Resume parsing failed for user {user_id}: {str(e)}")
            # Return partial profile
            profile = UserProfile(user_id=user_id)
            profile.parsing_status = "failed"
            profile.parsing_errors.append(str(e))
            return profile
    
    async def extract_text(self, file_path: str) -> str:
        """
        Extract text from various file formats
        
        Args:
            file_path: Path to the file
            
        Returns:
            Extracted text content
        """
        file_ext = Path(file_path).suffix.lower()
        
        try:
            if file_ext == ".pdf":
                return await self.extract_from_pdf(file_path)
            elif file_ext == ".docx":
                return await self.extract_from_docx(file_path)
            elif file_ext == ".doc":
                return await self.extract_from_doc(file_path)
            elif file_ext in [".txt", ".rtf"]:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")
                
        except Exception as e:
            logger.error(f"Text extraction failed: {str(e)}")
            raise
    
    async def extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF, fallback to OCR if needed"""
        text = ""
        
        try:
            # Try text extraction first
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
            
            # If text is too short, likely scanned PDF - use OCR
            if len(text.strip()) < 100:
                logger.info("PDF appears to be scanned, using OCR")
                text = await self.extract_with_ocr(file_path)
            
            return text
            
        except Exception as e:
            logger.error(f"PDF extraction failed: {str(e)}")
            # Try OCR as fallback
            return await self.extract_with_ocr(file_path)
    
    async def extract_with_ocr(self, file_path: str) -> str:
        """Extract text from scanned PDF using Tesseract OCR"""
        text = ""
        
        try:
            doc = fitz.open(file_path)
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                # Convert page to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # OCR the image
                page_text = pytesseract.image_to_string(img)
                text += page_text + "\n"
            
            doc.close()
            return text
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            raise ValueError("Could not extract text from scanned PDF")
    
    async def extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            logger.error(f"DOCX extraction failed: {str(e)}")
            raise
    
    async def extract_from_doc(self, file_path: str) -> str:
        """Extract text from DOC file using docx2txt"""
        try:
            text = docx2txt.process(file_path)
            return text
        except Exception as e:
            logger.error(f"DOC extraction failed: {str(e)}")
            raise

    
    async def parse_with_groq(self, resume_text: str) -> Dict:
        """
        Parse resume text using Groq LLM
        
        Args:
            resume_text: Extracted text from resume
            
        Returns:
            Dictionary with structured resume data
        """
        prompt = self._create_parsing_prompt(resume_text)
        
        try:
            response = groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert resume parser. Extract structured information accurately and return valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=settings.GROQ_TEMPERATURE,
                max_tokens=settings.GROQ_MAX_TOKENS,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            parsed_data = json.loads(content)
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"Groq parsing failed: {str(e)}")
            raise ValueError(f"LLM parsing failed: {str(e)}")
    
    def _create_parsing_prompt(self, resume_text: str) -> str:
        """Create the prompt for Groq LLM"""
        return f"""Extract structured information from this resume and return ONLY a valid JSON object.

Resume Text:
{resume_text[:15000]}

Return a JSON object with this EXACT structure:
{{
  "personal_info": {{
    "full_name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin_url": "string or null",
    "github_url": "string or null",
    "portfolio_url": "string or null"
  }},
  "summary": "string or null",
  "skills": {{
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "programming_languages": ["lang1", "lang2"],
    "tools_frameworks": ["tool1", "tool2"]
  }},
  "work_experience": [
    {{
      "company": "string",
      "position": "string",
      "location": "string or null",
      "start_date": "YYYY-MM or YYYY",
      "end_date": "YYYY-MM or YYYY or Present",
      "is_current": false,
      "responsibilities": ["resp1", "resp2"],
      "achievements": ["achievement1"],
      "technologies": ["tech1", "tech2"]
    }}
  ],
  "education": [
    {{
      "degree": "string",
      "field_of_study": "string or null",
      "institution": "string",
      "location": "string or null",
      "graduation_year": "YYYY",
      "gpa": "string or null"
    }}
  ],
  "certifications": [
    {{
      "name": "string",
      "issuer": "string or null",
      "date": "YYYY-MM or YYYY",
      "credential_id": "string or null"
    }}
  ],
  "projects": [
    {{
      "name": "string",
      "description": "string",
      "technologies": ["tech1", "tech2"],
      "url": "string or null"
    }}
  ]
}}

Rules:
- Use null for missing fields, not empty strings
- Extract ALL skills mentioned anywhere in the resume
- Normalize dates to YYYY-MM format when possible
- For current positions, set is_current to true and end_date to "Present"
- Be thorough - extract every detail
- Return ONLY the JSON object, no additional text
"""
    
    async def create_profile_from_parsed_data(self, parsed_data: Dict, user_id: str) -> UserProfile:
        """Convert parsed data dictionary to UserProfile model"""
        
        # Personal Info
        personal_info = PersonalInfo(**parsed_data.get("personal_info", {}))
        
        # Skills
        skills_data = parsed_data.get("skills", {})
        all_skills = []
        all_skills.extend(skills_data.get("technical", []))
        all_skills.extend(skills_data.get("soft", []))
        all_skills.extend(skills_data.get("programming_languages", []))
        all_skills.extend(skills_data.get("tools_frameworks", []))
        
        skills = Skills(
            technical=skills_data.get("technical", []),
            soft=skills_data.get("soft", []),
            programming_languages=skills_data.get("programming_languages", []),
            tools_frameworks=skills_data.get("tools_frameworks", []),
            all_skills_normalized=[s.lower().strip() for s in all_skills if s]
        )
        
        # Work Experience
        work_experience = [WorkExperience(**exp) for exp in parsed_data.get("work_experience", [])]
        
        # Education
        education = [Education(**edu) for edu in parsed_data.get("education", [])]
        
        # Certifications
        certifications = [Certification(**cert) for cert in parsed_data.get("certifications", [])]
        
        # Projects
        projects = [Project(**proj) for proj in parsed_data.get("projects", [])]
        
        # Calculate total years of experience
        total_years = self._calculate_years_of_experience(work_experience)
        
        # Determine experience level
        experience_level = self._determine_experience_level(total_years)
        
        # Calculate profile completeness
        completeness = self._calculate_completeness(
            personal_info, skills, work_experience, education, certifications, projects
        )
        
        profile = UserProfile(
            user_id=user_id,
            personal_info=personal_info,
            summary=parsed_data.get("summary"),
            skills=skills,
            work_experience=work_experience,
            education=education,
            certifications=certifications,
            projects=projects,
            total_years_experience=total_years,
            experience_level=experience_level,
            profile_completeness=completeness,
            last_updated=datetime.utcnow()
        )
        
        return profile
    
    def _calculate_years_of_experience(self, work_experience: list) -> float:
        """Calculate total years of professional experience"""
        total_months = 0
        
        for exp in work_experience:
            try:
                # Parse start date
                if exp.start_date:
                    start = self._parse_date(exp.start_date)
                else:
                    continue
                
                # Parse end date
                if exp.is_current or exp.end_date == "Present":
                    end = datetime.now()
                elif exp.end_date:
                    end = self._parse_date(exp.end_date)
                else:
                    continue
                
                # Calculate months
                months = (end.year - start.year) * 12 + (end.month - start.month)
                total_months += max(months, 0)
                
            except Exception as e:
                logger.warning(f"Could not parse experience dates: {str(e)}")
                continue
        
        return round(total_months / 12, 1)
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse various date formats"""
        try:
            # Try parsing with dateutil
            return date_parser.parse(date_str, fuzzy=True)
        except:
            # Fallback: extract year
            year_match = re.search(r'20\d{2}|19\d{2}', date_str)
            if year_match:
                return datetime(int(year_match.group()), 1, 1)
            raise ValueError(f"Could not parse date: {date_str}")
    
    def _determine_experience_level(self, years: float) -> str:
        """Determine experience level based on years"""
        if years < 2:
            return "entry"
        elif years < 5:
            return "mid"
        elif years < 10:
            return "senior"
        else:
            return "lead"
    
    def _calculate_completeness(self, personal_info, skills, work_exp, education, certs, projects) -> int:
        """Calculate profile completeness percentage"""
        score = 0
        
        # Personal info (30 points)
        if personal_info.full_name:
            score += 10
        if personal_info.email:
            score += 5
        if personal_info.phone:
            score += 5
        if personal_info.location:
            score += 5
        if personal_info.linkedin_url or personal_info.github_url:
            score += 5
        
        # Skills (25 points)
        if len(skills.all_skills_normalized) > 0:
            score += min(len(skills.all_skills_normalized) * 2, 25)
        
        # Work experience (25 points)
        if len(work_exp) > 0:
            score += min(len(work_exp) * 10, 25)
        
        # Education (10 points)
        if len(education) > 0:
            score += 10
        
        # Certifications (5 points)
        if len(certs) > 0:
            score += 5
        
        # Projects (5 points)
        if len(projects) > 0:
            score += 5
        
        return min(score, 100)


# Global instance
resume_parser = ResumeParser()

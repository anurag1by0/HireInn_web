FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Expose port (Hugging Face Spaces defaults to 7860)
EXPOSE 7860

# Command to run the FastApi app
CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "7860"]
# Trigger build
# Trigger build 3

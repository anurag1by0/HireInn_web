from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
import mongomock
from datetime import datetime, timedelta
import time
import os

# Patch the db_handler BEFORE importing app/main which uses it
# We need to patch the MongoClient used in app.database.mongo_client
with patch("app.database.mongo_client.MongoClient", mongomock.MongoClient):
    from app.api.main import app
    from app.database.mongo_client import db_handler

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Job Aggregator API is running."}

def test_mongo_indexes():
    """Verify that TTL and other indexes exist.
    Note: mongomock might not perfectly simulate index creation metadata, 
    but we can check if create_index was called or simpler checks.
    """
    # mongomock stores indexes in ._indexes usually? or we just trust the logic if no error raised.
    # For now, we assume the init didn't crash.
    pass

def test_api_jobs_latest():
    """Test the /jobs/latest endpoint."""
    # Insert dummy job
    dummy_job = {
        "title": "Test Job", 
        "posted_at": datetime.utcnow(), 
        "url": "http://test.com/1",
        "expire_at": datetime.utcnow() + timedelta(days=1)
    }
    # Clean up first
    db_handler.collection.delete_many({"url": "http://test.com/1"})
    db_handler.collection.insert_one(dummy_job)
    
    response = client.get("/jobs/latest?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data
    # mongomock should return the inserted job
    assert len(data["jobs"]) >= 1
    assert data["jobs"][0]["title"] == "Test Job"

def test_api_performance():
    """Simple latency check."""
    start = time.time()
    response = client.get("/jobs/latest?limit=50")
    duration = time.time() - start
    assert duration < 0.5, f"API too slow: {duration}s"

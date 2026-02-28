"""
Test Groq API connection
"""
import os
from groq import Groq

# Load from env
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

print(f"Testing Groq API...")
print(f"API Key: {api_key[:20]}..." if api_key else "No API key found")

try:
    client = Groq(api_key=api_key)
    
    # Simple test
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Hello, Groq API is working!' in JSON format with a 'message' field."}
        ],
        temperature=0.1,
        max_tokens=100,
        response_format={"type": "json_object"}
    )
    
    result = response.choices[0].message.content
    print(f"\n✅ SUCCESS! Groq API is working!")
    print(f"Response: {result}")
    
except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}")
    print(f"Message: {str(e)}")

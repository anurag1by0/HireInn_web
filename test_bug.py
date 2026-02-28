import requests

try:
    print("Logging in via Google...")
    res = requests.post('http://localhost:8000/api/auth/google', json={'email': 'test6@test.com', 'name': 'Test6', 'google_id': '66666'}, timeout=5)
    
    # Check if OK
    print(res.status_code, res.text)
    token = res.json()['access_token']
    
    print("\nUpdating profile...")
    headers = {'Authorization': f'Bearer {token}'}
    data = {'preferred_role': 'Software Eng', 'preferred_location': 'Remote'}
    
    res = requests.patch('http://localhost:8000/api/auth/profile/update', headers=headers, data=data, timeout=5)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print(e)

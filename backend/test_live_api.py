import requests
import json
from app.models.schemas import UserProfile

def test_live_endpoint():
    url = "http://localhost:8000/meal-plan"
    
    # We need a token or we can mock/bypass for local test if we find a way
    # But signup/login first is easier
    
    auth_url = "http://localhost:8000/auth/signup"
    user_data = {
        "email": "tester@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
    
    print("Attempting signup...")
    try:
        requests.post(auth_url, json=user_data)
    except:
        pass # Already exists
        
    login_url = "http://localhost:8000/auth/login"
    login_resp = requests.post(login_url, data={"username": "tester@example.com", "password": "password123"})
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.text}")
        return
        
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    data = {
        "days": 1,
        "meals_per_day": 3,
        "user_profile": {
            "height_cm": 180,
            "weight_kg": 75,
            "age": 30,
            "gender": "male",
            "activity_level": "moderately_active",
            "goal": "weight_loss",
            "dietary_restrictions": ["vegetarian"],
            "cuisine_preferences": ["Indian"]
        }
    }
    
    print("Calling /meal-plan...")
    resp = requests.post(url, json=data, headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text}")

if __name__ == "__main__":
    test_live_endpoint()

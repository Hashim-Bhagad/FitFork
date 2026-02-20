import os
from dotenv import load_dotenv
from google import genai
import requests

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SCALEDOWN_API_KEY = os.getenv("SCALEDOWN_API_KEY")
SCALEDOWN_URL = "https://api.scaledown.xyz/compress/raw/"

def check_gemini():
    print("--- Checking Gemini API ---")
    if not GEMINI_API_KEY:
        print("[FAIL] GEMINI_API_KEY missing from .env")
        return False
    
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        models = client.models.list()
        print("[SUCCESS] Connected to Gemini. Available models:")
        for m in models:
            print(f" - {m.name}")
        return True
    except Exception as e:
        print(f"[FAIL] Gemini error: {e}")
        return False

def check_scaledown():
    print("\n--- Checking Scaledown API ---")
    if not SCALEDOWN_API_KEY:
        print("[FAIL] SCALEDOWN_API_KEY missing from .env")
        return False
    
    headers = {'x-api-key': SCALEDOWN_API_KEY, 'Content-Type': 'application/json'}
    payload = {"context": "Test context", "prompt": "Test prompt", "scaledown": {"rate": "auto"}}
    try:
        resp = requests.post(SCALEDOWN_URL, headers=headers, json=payload, timeout=5)
        if resp.status_code == 200:
            print("[SUCCESS] Scaledown API responded correctly.")
            return True
        else:
            print(f"[FAIL] Scaledown responded with {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"[FAIL] Scaledown error: {e}")
        return False

if __name__ == "__main__":
    check_gemini()
    check_scaledown()

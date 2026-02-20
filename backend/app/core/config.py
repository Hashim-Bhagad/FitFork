import os
from dotenv import load_dotenv

load_dotenv()

# App Settings
APP_NAME = "FitFork"
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# MongoDB Config
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "fitfork"

# External APIs
SCALEDOWN_API_KEY = os.getenv("SCALEDOWN_API_KEY")
OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# API Base URLs
SCALEDOWN_URL = "https://api.scaledown.xyz/compress/raw/"
OPENROUTER_URL = "https://openrouter.ai/api/v1"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

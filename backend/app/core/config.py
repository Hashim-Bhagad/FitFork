import os
from dotenv import load_dotenv

load_dotenv()

# App Settings
APP_NAME = "Meal Planner AI"
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# ChromaDB Config
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_store")
COLLECTION_NAME = "recipes"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# MongoDB Config
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "meal_planner"

# External APIs
SCALEDOWN_API_KEY = os.getenv("SCALEDOWN_API_KEY")
OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY")

# API Base URLs
SCALEDOWN_URL = "https://api.scaledown.xyz/compress/raw/"
OPENROUTER_URL = "https://openrouter.ai/api/v1"

import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

# Mocking config for standalone run
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "fitfork"

def verify_mongo():
    if not MONGO_URI:
        print("MONGO_URI not found in environment.")
        return

    client = MongoClient(MONGO_URI)
    db = client.get_database(DB_NAME)
    users = db.get_collection("users")

    # Try to find any user with a meal plan
    user = users.find_one({"latest_meal_plan": {"$exists": True}})
    if user:
        print(f"Found user with meal plan: {user['email']}")
        plan = user.get("latest_meal_plan")
        print(f"Plan overview: {plan.get('overview', 'N/A')[:50]}...")
        print(f"Plan days: {len(plan.get('days', []))}")
        print(f"Has nutrition targets: {'nutrition_targets' in plan}")
    else:
        print("No user found with a saved meal plan.")

if __name__ == "__main__":
    verify_mongo()

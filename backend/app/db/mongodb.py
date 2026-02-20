from pymongo import MongoClient
from typing import Optional
from app.core.config import MONGO_URI, DB_NAME
from app.models.schemas import UserProfile

class MongoDBClient:
    def __init__(self):
        self.client = MongoClient(MONGO_URI) if MONGO_URI else None
        self.db = self.client.get_database(DB_NAME) if self.client else None
        self.users_collection = self.db.get_collection("users") if self.db is not None else None

    def create_user(self, user_data: dict):
        if self.users_collection is not None:
            # Check if user exists
            if self.users_collection.find_one({"email": user_data["email"]}):
                return None
            result = self.users_collection.insert_one(user_data)
            user_data["id"] = str(result.inserted_id)
            return user_data
        return None

    def get_user_by_email(self, email: str):
        if self.users_collection is not None:
            user = self.users_collection.find_one({"email": email})
            if user:
                user["id"] = str(user.pop("_id"))
                return user
        return None

    def save_user_profile(self, user_id: str, profile: UserProfile):
        if self.users_collection is not None:
            from bson import ObjectId
            self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"profile": profile.model_dump()}}
            )

    def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        if self.users_collection is not None:
            from bson import ObjectId
            user = self.users_collection.find_one({"_id": ObjectId(user_id)})
            if user and "profile" in user:
                return UserProfile(**user["profile"])
        return None

    def save_meal_plan(self, user_id: str, plan_data: dict):
        """Save the latest meal plan for the user."""
        if self.users_collection is not None:
            from bson import ObjectId
            self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"latest_meal_plan": plan_data}}
            )

    def get_latest_meal_plan(self, user_id: str) -> Optional[dict]:
        """Fetch the latest meal plan for the user."""
        if self.users_collection is not None:
            from bson import ObjectId
            user = self.users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                return user.get("latest_meal_plan")
        return None

mongodb_client = MongoDBClient()

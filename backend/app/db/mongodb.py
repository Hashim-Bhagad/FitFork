from pymongo import MongoClient
from typing import Optional
from app.core.config import MONGO_URI, DB_NAME
from app.models.schemas import UserProfile

class MongoDBClient:
    def __init__(self):
        self.client = MongoClient(MONGO_URI) if MONGO_URI else None
        self.db = self.client.get_database(DB_NAME) if self.client else None
        self.users_collection = self.db.get_collection("users") if self.db is not None else None
        self.recipes_collection = self.db.get_collection("recipes") if self.db is not None else None
        self.chat_collection = self.db.get_collection("chat_sessions") if self.db is not None else None
        
        # Build indexes on startup
        self.create_recipe_indexes()

    # --- CHAT METHODS ---

    def save_chat_message(self, user_id: str, role: str, content: str):
        if self.chat_collection is not None:
            self.chat_collection.insert_one({
                "user_id": user_id,
                "role": role,
                "content": content,
                "timestamp": __import__("datetime").datetime.utcnow()
            })

    def get_chat_history(self, user_id: str, limit: int = 20):
        if self.chat_collection is not None:
            cursor = self.chat_collection.find({"user_id": user_id}).sort("timestamp", 1).limit(limit)
            return [{"role": doc["role"], "content": doc["content"]} for doc in cursor]
        return []

    def clear_chat_history(self, user_id: str):
        if self.chat_collection is not None:
            self.chat_collection.delete_many({"user_id": user_id})

    # --- USER METHODS ---
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
            print(f"DEBUG: [MongoDB] Saving meal plan for user {user_id}")
            result = self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"latest_meal_plan": plan_data}}
            )
            print(f"DEBUG: [MongoDB] Update result: matched={result.matched_count}, modified={result.modified_count}")

    def get_latest_meal_plan(self, user_id: str) -> Optional[dict]:
        """Fetch the latest meal plan for the user."""
        if self.users_collection is not None:
            from bson import ObjectId
            print(f"DEBUG: [MongoDB] Fetching latest meal plan for user {user_id}")
            user = self.users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                plan = user.get("latest_meal_plan")
                if plan:
                    print("DEBUG: [MongoDB] Found saved meal plan")
                else:
                    print("DEBUG: [MongoDB] No saved meal plan found for user")
                return plan
        return None

    # --- RECIPE METHODS ---

    def create_recipe_indexes(self):
        """Build indexes for fast filtering and text search."""
        if self.recipes_collection is not None:
            self.recipes_collection.create_index([("dietary_tags", 1)])
            self.recipes_collection.create_index([("allergens", 1)])
            self.recipes_collection.create_index([
                ("title", "text"),
                ("description", "text")
            ])

    def find_recipes(self, query: str, profile: UserProfile, limit: int = 50) -> list:
        """
        No-Vector Retrieval: Deterministic Filter + Refined Text Search.
        Incorporates cuisine preferences into the search seed.
        """
        if self.recipes_collection is None:
            return []

        # 1. Build Filter (Diets and Allergens)
        filter_query = {}
        
        # Inclusion: Dietary restrictions
        # Change from $all (strict) to $in (softer) to ensure we get results even with multiple tags
        if profile.dietary_restrictions:
            filter_query["dietary_tags"] = {"$in": [r.lower() for r in profile.dietary_restrictions]}
            
        # Exclusion: Allergens
        if profile.allergens_to_avoid:
            filter_query["allergens"] = {"$nin": profile.allergens_to_avoid}

        # 2. Refine Text Search Query
        # Combine user's natural language request with their preferred cuisines
        search_terms = []
        if query and query.strip():
            search_terms.append(query.strip())
        
        if profile.cuisine_preferences:
            search_terms.extend(profile.cuisine_preferences)
            
        final_search_query = " ".join(search_terms)

        if final_search_query:
            filter_query["$text"] = {"$search": final_search_query}

        # 3. Execute Find
        cursor = self.recipes_collection.find(filter_query).limit(limit)
        
        # 4. Map to list
        recipes = []
        for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            recipes.append(doc)
            
        return recipes

mongodb_client = MongoDBClient()

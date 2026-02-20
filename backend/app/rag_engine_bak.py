"""
RAG Engine: ChromaDB retrieval + profile-aware query augmentation + reranking.
"""
import json
import chromadb
from chromadb.utils import embedding_functions
from typing import List, Optional
from models import UserProfile, RecipeResult, NutritionProfile
from nutrition import calculate_nutrition_profile

import os
import requests
from google import genai
from dotenv import load_dotenv

load_dotenv()

CHROMA_PATH = "./chroma_store"
COLLECTION_NAME = "recipes"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# API Keys
SCALEDOWN_API_KEY = os.getenv("SCALEDOWN_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

class ScaledownClient:
    """Client for ScaleDown prompt compression API."""
    URL = "https://api.scaledown.xyz/compress/raw/"

    @staticmethod
    def compress(context: str, prompt: str) -> str:
        if not SCALEDOWN_API_KEY:
            return context
        
        headers = {
            'x-api-key': SCALEDOWN_API_KEY,
            'Content-Type': 'application/json'
        }
        payload = {
            "context": context,
            "prompt": prompt,
            "scaledown": {"rate": "auto"}
        }
        try:
            response = requests.post(ScaledownClient.URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            if data.get("successful"):
                return data.get("compressed_prompt", context)
        except Exception as e:
            print(f"[Scaledown] Error: {e}")
        return context

class GeminiClient:
    """Client for Google Gemini LLM using the new google-genai SDK."""
    def __init__(self, model_name="gemini-1.5-flash"):
        self.model_name = model_name
        self.client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

    def generate(self, prompt: str) -> str:
        if not self.client:
            return "Gemini API key not found. Generation skipped."
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"Error generating content: {str(e)}"


def _build_augmented_query(query: str, profile: UserProfile, nutrition: NutritionProfile) -> str:
    """
    Augment the user's natural language query with their nutrition profile
    so the embedding captures their personal dietary context.
    """
    parts = [query]
    parts.append(f"User goal: {profile.goal.replace('_', ' ')}")
    parts.append(f"Target: {nutrition.target_calories:.0f} kcal/day")
    parts.append(f"{nutrition.protein_g:.0f}g protein, {nutrition.carbs_g:.0f}g carbs, {nutrition.fat_g:.0f}g fat")
    if profile.cuisine_preferences:
        parts.append(f"Preferred cuisines: {', '.join(profile.cuisine_preferences)}")
    if profile.dietary_restrictions:
        parts.append(f"Dietary: {', '.join(profile.dietary_restrictions)}")
    return ". ".join(parts)


def _build_metadata_filter(profile: UserProfile) -> Optional[dict]:
    """Build a ChromaDB $where filter to exclude allergen-forbidden recipes."""
    allergens = profile.allergens_to_avoid
    if not allergens:
        return None
    # ChromaDB: filter by checking allergens field doesn't contain them
    # We store allergens as comma-joined string, so we do a $not_contains per allergen
    # For multiple allergens, use $and
    if len(allergens) == 1:
        return {"allergens": {"$not_contains": allergens[0]}}
    conditions = [{"allergens": {"$not_contains": a}} for a in allergens]
    return {"$and": conditions}


def _parse_list_field(raw: str) -> List[str]:
    if not raw:
        return []
    return [x.strip() for x in raw.split(",") if x.strip()]


def _parse_json_list(raw: str) -> List[str]:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except Exception:
        return []


def _meta_to_recipe(meta: dict, score: float = None) -> RecipeResult:
    return RecipeResult(
        id=meta.get("recipe_id", ""),
        title=meta.get("title", ""),
        description=meta.get("description", ""),
        cuisine=meta.get("cuisine", ""),
        calories=meta.get("calories"),
        protein_g=meta.get("protein_g"),
        carbs_g=meta.get("carbs_g"),
        fat_g=meta.get("fat_g"),
        ingredients=_parse_json_list(meta.get("ingredients_raw", "[]")),
        instructions=_parse_json_list(meta.get("instructions_raw", "[]")),
        time_minutes=meta.get("time_minutes"),
        meal_types=_parse_list_field(meta.get("meal_types", "")),
        dietary_tags=_parse_list_field(meta.get("dietary_tags", "")),
        allergens=_parse_list_field(meta.get("allergens", "")),
        score=score,
    )


from pymongo import MongoClient
from pymongo.collection import Collection

class RAGEngine:
    def __init__(self):
        self._client = None
        self._collection = None
        self._ef = None
        self._mongo_client = None
        self._users_collection = None
        self._scaledown = ScaledownClient()
        self._gemini = GeminiClient()

    def _ensure_loaded(self):
        if self._collection is not None:
            return
        
        # Load ChromaDB
        self._ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL
        )
        self._client = chromadb.PersistentClient(path=CHROMA_PATH)
        self._collection = self._client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=self._ef,
        )

        # Load MongoDB
        if MONGO_URI:
            self._mongo_client = MongoClient(MONGO_URI)
            db = self._mongo_client.get_database("meal_planner")
            self._users_collection = db.get_collection("users")

    def save_user_profile(self, user_id: str, profile: UserProfile):
        self._ensure_loaded()
        if self._users_collection is not None:
            self._users_collection.update_one(
                {"user_id": user_id},
                {"$set": profile.dict()},
                upsert=True
            )

    def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        self._ensure_loaded()
        if self._users_collection is not None:
            data = self._users_collection.find_one({"user_id": user_id})
            if data:
                # Remove mongo _id if present
                data.pop("_id", None)
                data.pop("user_id", None)
                return UserProfile(**data)
        return None

    def search(
        self,
        query: str,
        profile: UserProfile,
        top_k: int = 5,
    ) -> List[RecipeResult]:
        self._ensure_loaded()

        nutrition = calculate_nutrition_profile(profile)
        augmented_query = _build_augmented_query(query, profile, nutrition)
        where_filter = _build_metadata_filter(profile)

        # Fetch extra candidates for light reranking (2x)
        n_candidates = min(top_k * 2, 20)
        query_kwargs = {
            "query_texts": [augmented_query],
            "n_results": n_candidates,
            "include": ["metadatas", "distances"],
        }
        if where_filter:
            query_kwargs["where"] = where_filter

        results = self._collection.query(**query_kwargs)

        metas = results["metadatas"][0]
        dists = results["distances"][0]

        # Convert cosine distance to similarity score
        recipes = []
        for meta, dist in zip(metas, dists):
            score = round(1 - dist, 4)
            recipes.append(_meta_to_recipe(meta, score))

        # Light rerank: boost recipes matching user's cuisine preferences
        if profile.cuisine_preferences:
            prefs = {c.lower() for c in profile.cuisine_preferences}
            for r in recipes:
                if r.cuisine and r.cuisine.lower() in prefs:
                    r.score = min(1.0, (r.score or 0) + 0.05)

        # Sort by score descending, return top_k
        recipes.sort(key=lambda r: r.score or 0, reverse=True)
        return recipes[:top_k]

    def generate_meal_plan(self, query: str, profile: UserProfile, days: int = 1) -> str:
        """
        Generate a personalized meal plan using Retrieve -> Compress -> Generate cycle.
        """
        self._ensure_loaded()
        
        # 1. Retrieve relevant recipes
        recipes = self.search(query, profile, top_k=10)
        
        # 2. Build context from recipes
        context_parts = []
        for r in recipes:
            context_parts.append(
                f"ID: {r.id}, Title: {r.title}, Calories: {r.calories}, "
                f"Protein: {r.protein_g}g, Carbs: {r.carbs_g}g, Fat: {r.fat_g}g, "
                f"Ingredients: {', '.join(r.ingredients[:10])}"
            )
        full_context = "\n".join(context_parts)
        
        # 3. Compress context using Scaledown
        system_prompt = (
            f"You are a professional nutritionist. Create a {days}-day meal plan for a user "
            f"with goal: {profile.goal}. They have dietary restrictions: {profile.dietary_restrictions}. "
            f"Use ONLY the following recipes as context. Format the output nicely."
        )
        compressed_context = self._scaledown.compress(full_context, query)
        
        # 4. Generate response with Gemini
        final_prompt = f"{system_prompt}\n\nUser Query: {query}\n\nRecipe Context:\n{compressed_context}"
        return self._gemini.generate(final_prompt)

    def get_recipe_by_id(self, recipe_id: str) -> Optional[RecipeResult]:
        self._ensure_loaded()
        results = self._collection.get(
            ids=[recipe_id],
            include=["metadatas"],
        )
        if results["metadatas"]:
            return _meta_to_recipe(results["metadatas"][0])
        return None

    def collection_count(self) -> int:
        self._ensure_loaded()
        return self._collection.count()


# Singleton instance
rag_engine = RAGEngine()

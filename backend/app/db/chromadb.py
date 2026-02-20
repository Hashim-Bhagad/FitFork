import chromadb
from chromadb.utils import embedding_functions
from typing import List, Optional
from app.core.config import CHROMA_PATH, COLLECTION_NAME, EMBEDDING_MODEL
from app.models.schemas import UserProfile, RecipeResult

class ChromaDBClient:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_PATH)
        self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL
        )
        self.collection = self.client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=self.ef,
        )

    def search(
        self,
        query: str,
        profile: UserProfile,
        top_k: int = 5,
    ) -> List[RecipeResult]:
        """
        Personalized retrieval: Filter -> Vector Search -> Rerank.
        """
        where_filter = self._build_metadata_filter(profile)
        
        # Expand candidates for reranking
        n_candidates = min(top_k * 2, 30)
        
        results = self.collection.query(
            query_texts=[query],
            n_results=n_candidates,
            where=where_filter,
            include=["metadatas", "distances"]
        )
        
        recipes = []
        if results["metadatas"] and results["metadatas"][0]:
            for meta, dist in zip(results["metadatas"][0], results["distances"][0]):
                score = round(1 - dist, 4)
                recipes.append(self._meta_to_recipe(meta, score))
        
        # Rerank: Boost recipes matching user's cuisine preferences
        if profile.cuisine_preferences:
            prefs = {c.lower() for c in profile.cuisine_preferences}
            for r in recipes:
                if r.cuisine and r.cuisine.lower() in prefs:
                    # Apply a small boost to the score
                    r.score = round(min(1.0, (r.score or 0) + 0.1), 4)
            
            # Re-sort after boosting
            recipes.sort(key=lambda r: r.score or 0, reverse=True)
            
        return recipes[:top_k]

    def _build_metadata_filter(self, profile: UserProfile) -> Optional[dict]:
        """
        Build a ChromaDB filter for both allergens (exclusion) and dietary restrictions (inclusion).
        """
        conditions = []
        
        # 1. Exclusion: Allergens (using $not_contains)
        if profile.allergens_to_avoid:
            for allergen in profile.allergens_to_avoid:
                conditions.append({"allergens": {"$not_contains": allergen}})
        
        # 2. Inclusion: Dietary Restrictions (using $contains)
        # Each restriction must be present in the recipe's dietary_tags
        if profile.dietary_restrictions:
            for restriction in profile.dietary_restrictions:
                conditions.append({"dietary_tags": {"$contains": restriction.lower()}})
        
        if not conditions:
            return None
        
        if len(conditions) == 1:
            return conditions[0]
        
        return {"$and": conditions}

    def _meta_to_recipe(self, meta: dict, score: float = None) -> RecipeResult:
        import json
        def parse_list(raw): return [x.strip() for x in raw.split(",") if x.strip()] if raw else []
        def parse_json(raw):
            try: return json.loads(raw)
            except: return []
            
        return RecipeResult(
            id=meta.get("recipe_id", ""),
            title=meta.get("title", ""),
            description=meta.get("description", ""),
            cuisine=meta.get("cuisine", ""),
            calories=meta.get("calories"),
            protein_g=meta.get("protein_g"),
            carbs_g=meta.get("carbs_g"),
            fat_g=meta.get("fat_g"),
            ingredients=parse_json(meta.get("ingredients_raw", "[]")),
            instructions=parse_json(meta.get("instructions_raw", "[]")),
            time_minutes=meta.get("time_minutes"),
            meal_types=parse_list(meta.get("meal_types", "")),
            dietary_tags=parse_list(meta.get("dietary_tags", "")),
            allergens=parse_list(meta.get("allergens", "")),
            score=score,
        )

    def get_recipe_by_id(self, recipe_id: str) -> Optional[RecipeResult]:
        results = self.collection.get(ids=[recipe_id], include=["metadatas"])
        if results["metadatas"]:
            return self._meta_to_recipe(results["metadatas"][0])
        return None

chromadb_client = ChromaDBClient()

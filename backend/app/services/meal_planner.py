import json
import requests
from typing import List, Optional
from openai import OpenAI
from app.core.config import (
    SCALEDOWN_API_KEY, SCALEDOWN_URL, OPEN_ROUTER_API_KEY, OPENROUTER_URL
)
from app.core.prompts import build_meal_plan_system_prompt, build_augmented_query
from app.db.chromadb import chromadb_client
from app.services.nutrition import calculate_nutrition_profile
from app.models.schemas import UserProfile, CalendarResponse

class MealPlannerService:
    def __init__(self):
        self.client = OpenAI(
            base_url=OPENROUTER_URL,
            api_key=OPEN_ROUTER_API_KEY,
        ) if OPEN_ROUTER_API_KEY else None
        self.model_name = "google/gemini-2.0-flash-001"

    def generate_interactive_meal_plan(self, query: str, profile: UserProfile, days: int = 7) -> CalendarResponse:
        """
        Full RAG pipeline: Retrieve -> Compress -> Generate Structured JSON via OpenRouter.
        """
        # 1. Calculate nutrition needs
        nutrition = calculate_nutrition_profile(profile)
        
        # 2. Retrieve relevant recipes
        aug_query = build_augmented_query(query, profile, nutrition)
        recipes = chromadb_client.search(aug_query, profile, top_k=15)
        
        # 3. Build recipe context
        context_parts = []
        for r in recipes:
            context_parts.append(
                f"ID: {r.id}, Title: {r.title}, Cal: {r.calories}, "
                f"P: {r.protein_g}g, C: {r.carbs_g}g, F: {r.fat_g}g"
            )
        full_context = "\n".join(context_parts)
        
        # 4. Compress context via Scaledown
        compressed_context = self._compress_prompt(full_context, query)
        
        # 5. Build system and final prompt
        system_prompt = build_meal_plan_system_prompt(profile, days)
        final_prompt = f"User Request: {query}\n\nRecipe Context:\n{compressed_context}"
        
        # 6. Generate with OpenRouter
        if not self.client:
            raise Exception("OpenRouter API key missing")
            
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": final_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        
        # ─── DETAILED RAG LOGGING ───
        print("\n" + "="*50)
        print("🚀 RAW RAG OUTPUT (OpenRouter JSON)")
        print("="*50)
        print(content)
        print("="*50 + "\n")
        
        # 7. Parse and return
        try:
            raw_text = content.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:-3].strip()
            
            data = json.loads(raw_text)
            plan_obj = CalendarResponse(**data)
            plan_obj.nutrition_targets = nutrition
            return plan_obj
        except Exception as e:
            print(f"❌ [MealPlanner] Failed to parse JSON: {e}\nRaw: {content}")
            raise Exception("Failed to generate a valid interactive meal plan.")

    def _compress_prompt(self, context: str, prompt: str) -> str:
        if not SCALEDOWN_API_KEY:
            return context
        
        headers = {'x-api-key': SCALEDOWN_API_KEY, 'Content-Type': 'application/json'}
        payload = {"context": context, "prompt": prompt, "scaledown": {"rate": "auto"}}
        
        try:
            resp = requests.post(SCALEDOWN_URL, headers=headers, json=payload, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("compressed_prompt", context) if data.get("successful") else context
        except Exception as e:
            print(f"[Scaledown] Error: {e}")
            return context

meal_planner_service = MealPlannerService()

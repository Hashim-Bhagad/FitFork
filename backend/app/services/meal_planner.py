import json
import requests
from typing import List, Optional
from google import genai
from app.core.config import (
    SCALEDOWN_API_KEY, SCALEDOWN_URL, GEMINI_API_KEY
)
from app.core.prompts import build_meal_plan_system_prompt, build_augmented_query
from app.db.mongodb import mongodb_client
from app.services.nutrition import calculate_nutrition_profile
from app.models.schemas import UserProfile, CalendarResponse

class MealPlannerService:
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
        self.model_name = "gemini-2.5-flash"

    def generate_interactive_meal_plan(self, query: str, profile: UserProfile, days: int = 7, user_id: str = None) -> CalendarResponse:
        """
        Orchestrates the RAG-based meal plan generation.
        """
        # 1. Broaden the search by augmenting the query
        nut_profile = calculate_nutrition_profile(profile)
        search_terms = build_augmented_query(query, profile, nut_profile)
        
        # 2. Find Candidates from MongoDB
        recipes = mongodb_client.find_recipes(search_terms, profile, limit=40)
        
        if not recipes:
             print("DEBUG: [MealPlanner] No recipes found with strict filters, broadening search")
             recipes = mongodb_client.find_recipes(profile.goal, profile, limit=20)

        # 3. Build Prompts
        system_prompt = build_meal_plan_system_prompt(profile, nut_profile, days)
        
        recipe_context = "\n".join([
            f"- {r['title']} (ID: {str(r['_id'])}): {r.get('calories', 'N/A')} kcal, P: {r.get('protein_g','N/A')}g, C: {r.get('carbs_g','N/A')}g, F: {r.get('fat_g','N/A')}g"
            for r in recipes
        ])

        history_text = ""
        if user_id:
            chat_history = mongodb_client.get_chat_history(user_id)
            history_text = "\n".join([f"{h['role']}: {h['content']}" for h in chat_history[-5:]])

        final_prompt = f"""
        User Request: {query}
        Available Recipes (Inject these where possible):
        {recipe_context}
        
        Recent Chat Context:
        {history_text}
        
        Generate a {days}-day plan in JSON format.
        """

        # 4. Call Gemini (Modern SDK)
        if not self.client:
            raise Exception("Gemini API Key missing")

        try:
            print(f"DEBUG: Calling Gemini with {len(recipes)} candidates")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=final_prompt,
                config={
                    "system_instruction": system_prompt,
                    "response_mime_type": "application/json"
                }
            )
            
            # Using response.text to get the JSON string
            print(f"DEBUG: Gemini Response received: {response.text[:200]}...")
            plan_data = json.loads(response.text)
            
            # Create Pydantic model
            plan = CalendarResponse(**plan_data)
            
            # ENHANCEMENT: Always ensure nutrition_targets is populated
            if not plan.nutrition_targets:
                print("DEBUG: Injecting nutrition profile into plan")
                plan.nutrition_targets = nut_profile
                
            return plan
        except Exception as e:
            print(f"DEBUG: Meal Plan Generation Error: {str(e)}")
            raise e

meal_planner_service = MealPlannerService()
